<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class JsonDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $frontendDataPath = base_path('../Frontend/src/data');

        // Users
        $users = json_decode(File::get("$frontendDataPath/users.json"), true);
        foreach ($users as $user) {
            $user['caseIds'] = isset($user['caseIds']) ? json_encode($user['caseIds']) : null;
            DB::table('users')->insert($user);
        }

        // Cases
        $cases = json_decode(File::get("$frontendDataPath/cases.json"), true);
        foreach ($cases as $case) {
            DB::table('case_models')->insert($case);
        }

        // Clients
        $clients = json_decode(File::get("$frontendDataPath/clients.json"), true);
        foreach ($clients as $client) {
            $client['notes'] = isset($client['notes']) ? json_encode($client['notes']) : null;
            DB::table('clients')->insert($client);
        }

        // Tasks
        $tasks = json_decode(File::get("$frontendDataPath/tasks.json"), true);
        foreach ($tasks as $task) {
            DB::table('tasks')->insert($task);
        }

        // Events
        $events = json_decode(File::get("$frontendDataPath/events.json"), true);
        foreach ($events as $event) {
            DB::table('events')->insert($event);
        }

        // Documents
        $documents = json_decode(File::get("$frontendDataPath/documents.json"), true);
        foreach ($documents as $document) {
            DB::table('documents')->insert($document);
        }

        // Invoices
        $invoices = json_decode(File::get("$frontendDataPath/invoices.json"), true);
        foreach ($invoices as $invoice) {
            DB::table('invoices')->insert($invoice);
        }

        // Messages
        $messages = json_decode(File::get("$frontendDataPath/messages.json"), true);
        foreach ($messages as $message) {
            DB::table('messages')->insert($message);
        }
    }
}
