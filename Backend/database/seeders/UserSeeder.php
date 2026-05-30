<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                "id" => "u1",
                "email" => "admin@firm.com",
                "password" => "admin",
                "name" => "Eleanor Vance",
                "role" => "admin",
                "title" => "Managing Partner",
                "avatar" => "EV",
                "caseIds" => json_encode([])
            ],
            [
                "id" => "u2",
                "email" => "lawyer@firm.com",
                "password" => "lawyer",
                "name" => "Marcus Hale",
                "role" => "lawyer",
                "title" => "Senior Associate",
                "avatar" => "MH",
                "caseIds" => json_encode([])
            ],
            [
                "id" => "u3",
                "email" => "paralegal@firm.com",
                "password" => "paralegal",
                "name" => "Sofia Reyes",
                "role" => "paralegal",
                "title" => "Paralegal",
                "avatar" => "SR",
                "caseIds" => json_encode([])
            ],
            [
                "id" => "u4",
                "email" => "client@firm.com",
                "password" => "client",
                "name" => "James Whitaker",
                "role" => "client",
                "title" => "Client",
                "avatar" => "JW",
                "caseIds" => json_encode([])
            ],
            [
                "id" => "u5",
                "email" => "client2@firm.com",
                "password" => "client",
                "name" => "Ana Martinez",
                "role" => "client",
                "title" => "Client",
                "avatar" => "AM",
                "caseIds" => json_encode([])
            ]
        ];

        foreach ($users as $user) {
            DB::table('users')->insert($user);
        }

        $clients = [
            [
                "id" => "cl_1",
                "name" => "James Whitaker",
                "email" => "client@firm.com",
                "phone" => "+1 (555) 012-3456",
                "company" => "Whitaker Capital",
                "since" => "2024-01-15",
                "activeCases" => 1,
                "outstanding" => 1250.00,
                "retainerBalance" => 5000.00,
                "address" => "500 Sansome St, San Francisco, CA 94111",
                "notes" => json_encode([])
            ],
            [
                "id" => "cl_2",
                "name" => "Ana Martinez",
                "email" => "client2@firm.com",
                "phone" => "+1 (555) 987-6543",
                "company" => "Self-Employed",
                "since" => "2024-03-22",
                "activeCases" => 1,
                "outstanding" => 0.00,
                "retainerBalance" => 2500.00,
                "address" => "123 Broadway, Oakland, CA 94612",
                "notes" => json_encode([])
            ]
        ];

        foreach ($clients as $client) {
            $client['created_at'] = now();
            $client['updated_at'] = now();
            DB::table('clients')->insert($client);
        }
    }
}
