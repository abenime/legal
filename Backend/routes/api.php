<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Login
Route::post('/login', function (Request $request) {
    $user = DB::table('users')
        ->where('email', $request->email)
        ->where('password', $request->password)
        ->first();

    if (!$user) {
        return response()->json(null, 401);
    }

    if (isset($user->caseIds)) {
        $user->caseIds = json_decode($user->caseIds);
    } else {
        $user->caseIds = [];
    }
    return response()->json($user);
});

// Signup
Route::post('/signup', function (Request $request) {
    $data = $request->only(['name', 'email', 'password', 'phone']);
    $exists = DB::table('users')->where('email', $data['email'])->exists();
    if ($exists) {
        return response()->json(['error' => 'Email already registered'], 400);
    }

    $words = explode(' ', $data['name']);
    $initials = '';
    foreach ($words as $word) {
        if (!empty($word)) {
            $initials .= strtoupper(substr($word, 0, 1));
        }
    }
    $initials = substr($initials, 0, 2);
    if (empty($initials)) {
        $initials = 'U';
    }

    $newUser = [
        'id' => 'u-' . time(),
        'email' => $data['email'],
        'password' => $data['password'],
        'name' => $data['name'],
        'role' => 'client',
        'title' => 'Client',
        'avatar' => $initials,
        'caseIds' => json_encode([]),
        'phone' => $data['phone'] ?? null,
    ];

    DB::table('users')->insert($newUser);
    $newUser['caseIds'] = [];
    return response()->json($newUser, 201);
});

// Users
Route::get('/users', function () {
    $users = DB::table('users')->get();
    foreach ($users as $user) {
        if (isset($user->caseIds)) {
            $user->caseIds = json_decode($user->caseIds);
        } else {
            $user->caseIds = [];
        }
    }
    return response()->json($users);
});

Route::put('/users/{id}/role', function (Request $request, $id) {
    $newRole = $request->input('role');
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
    if ($user && isset($user->caseIds)) {
        $user->caseIds = json_decode($user->caseIds);
    } else if ($user) {
        $user->caseIds = [];
    }
    return response()->json($user);
});

// Cases
Route::get('/cases', function () {
    return response()->json(DB::table('case_models')->get());
});

Route::get('/cases/{id}', function ($id) {
    return response()->json(DB::table('case_models')->where('id', $id)->first());
});

Route::post('/cases', function (Request $request) {
    $data = $request->all();
    DB::table('case_models')->insert($data);
    return response()->json($data, 201);
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
    $apiKey = env('GEMINI_API_KEY');
    
    if (!$apiKey) {
        return response()->json(['error' => 'Gemini API key not configured'], 500);
    }

    $url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" . $apiKey;
    
    try {
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

        return response()->json(['text' => $text]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Server error during AI request',
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
