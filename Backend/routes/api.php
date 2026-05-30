<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

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

// Tasks
Route::get('/tasks', function () {
    return response()->json(DB::table('tasks')->get());
});

Route::post('/tasks', function (Request $request) {
    $data = $request->all();
    DB::table('tasks')->insert($data);
    return response()->json($data, 201);
});

// Events
Route::get('/events', function () {
    return response()->json(DB::table('events')->get());
});

Route::post('/events', function (Request $request) {
    $data = $request->all();
    DB::table('events')->insert($data);
    return response()->json($data, 201);
});

// Documents
Route::get('/documents', function () {
    return response()->json(DB::table('documents')->get());
});

// Invoices
Route::get('/invoices', function () {
    return response()->json(DB::table('invoices')->get());
});

// Messages
Route::get('/messages', function () {
    return response()->json(DB::table('messages')->get());
});

// Analytics
Route::get('/analytics', function () {
    $frontendDataPath = base_path('../Frontend/src/data');
    return response()->json(json_decode(file_get_contents("$frontendDataPath/analytics.json")));
});
