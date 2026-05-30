<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

if (! function_exists('client_portal_case_ids')) {
    function client_portal_case_ids(mixed $caseIds): array
    {
        if (is_array($caseIds)) {
            return $caseIds;
        }

        if (is_string($caseIds) && $caseIds !== '') {
            $decoded = json_decode($caseIds, true);

            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }
}

if (! function_exists('client_portal_avatar')) {
    function client_portal_avatar(string $name): string
    {
        $initials = '';

        foreach (preg_split('/\s+/', trim($name)) ?: [] as $word) {
            if ($word !== '') {
                $initials .= strtoupper(substr($word, 0, 1));
            }

            if (strlen($initials) >= 2) {
                break;
            }
        }

        return $initials !== '' ? substr($initials, 0, 2) : 'U';
    }
}

if (! function_exists('client_portal_user_payload')) {
    function client_portal_user_payload(object $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'role' => $user->role,
            'title' => $user->title ?? 'Client',
            'avatar' => $user->avatar ?? client_portal_avatar($user->name),
            'caseIds' => client_portal_case_ids($user->caseIds ?? []),
            'phone' => $user->phone ?? null,
        ];
    }
}

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Login
Route::post('/login', function (Request $request) {
    $validated = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required', 'string'],
    ]);

    $user = DB::table('users')
        ->where('email', $validated['email'])
        ->first();

    if (!$user) {
        return response()->json(['message' => 'Invalid email or password'], 401);
    }

    $plainTextMatch = hash_equals((string) $user->password, $validated['password']);
    $hashedMatch = Hash::check($validated['password'], $user->password);

    if (! $plainTextMatch && ! $hashedMatch) {
        return response()->json(['message' => 'Invalid email or password'], 401);
    }

    if ($plainTextMatch && ! $hashedMatch) {
        DB::table('users')
            ->where('id', $user->id)
            ->update([
                'password' => Hash::make($validated['password']),
            ]);
    }

    return response()->json(client_portal_user_payload($user));
});

// Signup
Route::post('/signup', function (Request $request) {
    $validated = $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        'password' => ['required', 'string', 'min:8'],
        'phone' => ['required', 'string', 'max:30'],
    ]);

    $userId = 'u-' . Str::ulid();
    $avatar = client_portal_avatar($validated['name']);

    DB::transaction(function () use ($validated, $userId, $avatar): void {
        DB::table('users')->insert([
            'id' => $userId,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'name' => $validated['name'],
            'role' => 'client',
            'title' => 'Client',
            'avatar' => $avatar,
            'caseIds' => json_encode([]),
            'phone' => $validated['phone'],
        ]);

        DB::table('clients')->insert([
            'id' => $userId,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'company' => null,
            'since' => now()->toDateString(),
            'activeCases' => 0,
            'outstanding' => 0,
            'retainerBalance' => 0,
            'address' => null,
            'notes' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    });

    $user = DB::table('users')->where('id', $userId)->first();

    return response()->json(client_portal_user_payload($user), 201);
});

// Users
Route::get('/users', function () {
    $users = DB::table('users')->get();

    return response()->json($users->map(fn ($user) => client_portal_user_payload($user)));
});

Route::put('/users/{id}/role', function (Request $request, $id) {
    $validated = $request->validate([
        'role' => ['required', 'in:admin,lawyer,paralegal,client'],
    ]);

    $newRole = $validated['role'];
    $titleMap = [
        'admin' => 'Managing Partner',
        'lawyer' => 'Attorney',
        'paralegal' => 'Paralegal',
        'client' => 'Client',
    ];

    $title = $titleMap[$newRole] ?? 'Client';

    DB::table('users')->where('id', $id)->update([
        'role' => $newRole,
        'title' => $title
    ]);

    $user = DB::table('users')->where('id', $id)->first();

    if (!$user) {
        return response()->json(['message' => 'User not found'], 404);
    }

    return response()->json(client_portal_user_payload($user));
});

// Cases
Route::get('/cases', function () {
    $cases = DB::table('case_models')->get();
    foreach ($cases as $case) {
        if (isset($case->details) && is_string($case->details)) {
            $case->details = json_decode($case->details);
        }
    }
    return response()->json($cases);
});

Route::get('/cases/{id}', function ($id) {
    $case = DB::table('case_models')->where('id', $id)->first();
    if ($case && isset($case->details) && is_string($case->details)) {
        $case->details = json_decode($case->details);
    }
    return response()->json($case);
});

Route::post('/cases', function (Request $request) {
    $data = $request->all();
    if (isset($data['details']) && is_array($data['details'])) {
        $data['details'] = json_encode($data['details']);
    }
    DB::table('case_models')->insert($data);
    return response()->json($data, 201);
});

Route::put('/cases/{id}', function (Request $request, $id) {
    $data = $request->all();
    if (isset($data['details']) && is_array($data['details'])) {
        $data['details'] = json_encode($data['details']);
    }
    
    // Remove created_at and updated_at if they exist in payload to avoid DB errors
    unset($data['created_at']);
    unset($data['updated_at']);

    DB::table('case_models')->where('id', $id)->update($data);
    
    $case = DB::table('case_models')->where('id', $id)->first();
    if ($case && isset($case->details) && is_string($case->details)) {
        $case->details = json_decode($case->details);
    }
    return response()->json($case);
});

// Clients
Route::get('/clients', function () {
    $clients = DB::table('clients')->get();
    foreach ($clients as $client) {
        if (isset($client->notes) && is_string($client->notes)) {
            $client->notes = json_decode($client->notes);
        }
    }
    return response()->json($clients);
});

Route::post('/clients', function (Request $request) {
    $data = $request->all();
    if (isset($data['notes']) && is_array($data['notes'])) {
        $data['notes'] = json_encode($data['notes']);
    }
    DB::table('clients')->insert($data);
    return response()->json($data, 201);
});

Route::put('/clients/{id}', function (Request $request, $id) {
    $data = $request->all();
    if (isset($data['notes']) && is_array($data['notes'])) {
        $data['notes'] = json_encode($data['notes']);
    }
    DB::table('clients')->where('id', $id)->update($data);
    $client = DB::table('clients')->where('id', $id)->first();
    if ($client && isset($client->notes) && is_string($client->notes)) {
        $client->notes = json_decode($client->notes);
    }
    return response()->json($client);
});

// Tasks
Route::get('/tasks', function (Request $request) {
    $query = DB::table('tasks');
    if ($request->has('caseId')) {
        $query->where('caseId', $request->caseId);
    }
    return response()->json($query->get());
});

Route::post('/tasks', function (Request $request) {
    $data = $request->all();
    DB::table('tasks')->insert($data);
    return response()->json($data, 201);
});

// Events
Route::get('/events', function (Request $request) {
    $query = DB::table('events');
    if ($request->has('caseId')) {
        $query->where('caseId', $request->caseId);
    }
    return response()->json($query->get());
});

Route::post('/events', function (Request $request) {
    $data = $request->all();
    DB::table('events')->insert($data);
    return response()->json($data, 201);
});

// Documents
Route::get('/documents', function (Request $request) {
    $query = DB::table('documents');
    if ($request->has('caseId')) {
        $query->where('caseId', $request->caseId);
    }
    return response()->json($query->get());
});

Route::post('/documents', function (Request $request) {
    if ($request->hasFile('file')) {
        $file = $request->file('file');
        $caseId = $request->input('caseId');
        $path = $file->store('documents', 'public');
        
        $data = [
            'id' => 'doc-' . time() . '-' . uniqid(),
            'caseId' => $caseId,
            'name' => $file->getClientOriginalName(),
            'type' => strtoupper($file->getClientOriginalExtension()) ?: 'PDF',
            'size' => round($file->getSize() / 1024 / 1024, 2) . ' MB',
            'uploadedBy' => $request->input('uploadedBy', 'System'),
            'uploadedAt' => now()->toDateString(),
            'signed' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        
        DB::table('documents')->insert($data);
        return response()->json($data, 201);
    }
    
    // Fallback for metadata-only (simulated/legacy)
    $data = $request->all();
    if (!isset($data['id'])) {
        $data['id'] = 'doc-' . time();
    }
    DB::table('documents')->insert($data);
    return response()->json($data, 201);
});

// Invoices
Route::get('/invoices', function () {
    return response()->json(DB::table('invoices')->get());
});

// Messages
Route::get('/messages', function () {
    return response()->json(DB::table('messages')->get());
});

Route::post('/messages', function (Request $request) {
    $data = $request->all();
    DB::table('messages')->insert($data);
    return response()->json($data, 201);
});

// Settings
Route::get('/settings', function () {
    $settings = DB::table('settings')->pluck('value', 'key');
    if (isset($settings['logo_path'])) {
        $settings['logo_url'] = asset('storage/' . $settings['logo_path']);
    }
    return response()->json($settings);
});

Route::post('/settings', function (Request $request) {
    $data = $request->all();
    foreach ($data as $key => $value) {
        if (is_array($value)) {
            $value = json_encode($value);
        }
        DB::table('settings')->updateOrInsert(
            ['key' => $key],
            ['value' => $value, 'updated_at' => now()]
        );
    }
    return response()->json(DB::table('settings')->pluck('value', 'key'));
});

Route::post('/settings/logo', function (Request $request) {
    if ($request->hasFile('logo')) {
        $path = $request->file('logo')->store('company', 'public');
        
        DB::table('settings')->updateOrInsert(
            ['key' => 'logo_path'],
            ['value' => $path, 'updated_at' => now()]
        );

        return response()->json([
            'logo_path' => $path,
            'logo_url' => asset('storage/' . $path)
        ]);
    }
    return response()->json(['error' => 'No file uploaded'], 400);
});

// AI
Route::get('/ai-debug', function() {
    return response()->json([
        'status' => 'ok',
        'has_api_key' => !empty(env('GEMINI_API_KEY')),
        'time' => now()->toDateTimeString()
    ]);
});

Route::post('/ai-chat', function (Request $request) {
    $prompt = $request->input('prompt');
    $userId = $request->input('userId');
    
    if (!$prompt) {
        return response()->json(['error' => 'Prompt is required'], 400);
    }

    $apiKey = env('GEMINI_API_KEY');
    
    if (!$apiKey) {
        return response()->json(['error' => 'Gemini API key not configured'], 500);
    }

    $url = "https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=" . $apiKey;
    
    try {
        // Save user message if userId is provided
        if ($userId) {
            DB::table('messages')->insert([
                'id' => (string) Str::uuid(),
                'from' => $userId,
                'to' => 'AI_ASSISTANT',
                'body' => $prompt,
                'caseId' => 'AI_CHAT',
                'fromName' => 'You',
                'at' => now(),
                'read' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $response = Http::asJson()->post($url, [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ]
        ]);

        if ($response->failed()) {
            return response()->json([
                'error' => 'AI request failed',
                'status' => $response->status(),
                'details' => $response->json(),
            ], $response->status());
        }

        $data = $response->json();
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'No response from AI.';

        // Save AI response if userId is provided
        if ($userId) {
            DB::table('messages')->insert([
                'id' => (string) Str::uuid(),
                'from' => 'AI_ASSISTANT',
                'to' => $userId,
                'body' => $text,
                'caseId' => 'AI_CHAT',
                'fromName' => 'AI Assistant',
                'at' => now(),
                'read' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['text' => $text]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Server error during AI request',
            'message' => $e->getMessage()
        ], 500);
    }
});

Route::get('/ai-history/{userId}', function ($userId) {
    $messages = DB::table('messages')
        ->where('caseId', 'AI_CHAT')
        ->where(function($query) use ($userId) {
            $query->where('from', $userId)
                  ->orWhere('to', $userId);
        })
        ->orderBy('at', 'asc')
        ->get();
    
    return response()->json($messages);
});

Route::post('/ai-review', function (Request $request) {
    if (!$request->hasFile('file')) {
        return response()->json(['error' => 'No file uploaded'], 400);
    }

    $file = $request->file('file');
    $userId = $request->input('userId');
    $caseId = $request->input('caseId', 'GENERAL_REVIEW');

    try {
        $parser = new \Smalot\PdfParser\Parser();
        $pdf = $parser->parseFile($file->getPathname());
        $text = $pdf->getText();

        if (empty(trim($text))) {
            return response()->json(['error' => 'Could not extract text from PDF'], 422);
        }

        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return response()->json(['error' => 'Gemini API key not configured'], 500);
        }

        $url = "https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=" . $apiKey;
        
        $prompt = "Review the following contract and highlight three major risks and two key provisions regarding governing law and payment terms. Format the response clearly using Markdown.\n\nCONTRACT TEXT:\n" . $text;

        // Save user message (simulated for history)
        if ($userId) {
            DB::table('messages')->insert([
                'id' => (string) Str::uuid(),
                'from' => $userId,
                'to' => 'AI_ASSISTANT',
                'body' => "Please review the uploaded contract: " . $file->getClientOriginalName(),
                'caseId' => 'AI_CHAT',
                'fromName' => 'You',
                'at' => now(),
                'read' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $response = Http::asJson()->post($url, [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ]
        ]);

        if ($response->failed()) {
            return response()->json([
                'error' => 'AI request failed',
                'status' => $response->status(),
                'details' => $response->json(),
            ], $response->status());
        }

        $data = $response->json();
        $aiText = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'No response from AI.';

        // Save AI response
        if ($userId) {
            DB::table('messages')->insert([
                'id' => (string) Str::uuid(),
                'from' => 'AI_ASSISTANT',
                'to' => $userId,
                'body' => $aiText,
                'caseId' => 'AI_CHAT',
                'fromName' => 'AI Assistant',
                'at' => now(),
                'read' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['text' => $aiText]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Review failed',
            'message' => $e->getMessage()
        ], 500);
    }
});

// Analytics
Route::get('/analytics', function () {
    return response()->json([
        "revenue" => ["ytd" => 0, "lastMonth" => 0, "thisMonth" => 0, "growth" => 0],
        "cases" => ["active" => 0, "closedYtd" => 0, "winRate" => 0, "avgDuration" => 0],
        "monthlyRevenue" => [],
        "practiceBreakdown" => [],
        "lawyerProductivity" => []
    ]);
});
