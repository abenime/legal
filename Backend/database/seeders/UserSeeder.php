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
    }
}
