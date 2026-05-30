<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SampleDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Cases
        $cases = [
            [
                "id" => "c1",
                "number" => "2024-PI-0482",
                "title" => "Whitaker v. City of San Francisco",
                "client" => "James Whitaker",
                "clientId" => "u4",
                "practice" => "Personal Injury",
                "stage" => "Discovery",
                "status" => "active",
                "lead" => "Eleanor Vance",
                "court" => "Superior Court of SF",
                "judge" => "Hon. Maria Garcia",
                "hearingDate" => "2024-06-15",
                "openedAt" => "2024-01-20",
                "nextDeadline" => "2024-05-30",
                "billable" => 12500.50,
                "priority" => "high",
                "description" => "Personal injury claim resulting from a sidewalk maintenance failure near 500 Sansome Street.",
                "details" => json_encode([
                    "Opposing Counsel" => "David Chen, City Attorney's Office",
                    "Insurance Claim #" => "AX-99283-00",
                    "Police Report #" => "24-00192"
                ])
            ],
            [
                "id" => "c2",
                "number" => "2024-EP-0115",
                "title" => "Martinez Estate Planning",
                "client" => "Ana Martinez",
                "clientId" => "u5",
                "practice" => "Estate Planning",
                "stage" => "Drafting",
                "status" => "active",
                "lead" => "Marcus Hale",
                "court" => null,
                "judge" => null,
                "hearingDate" => null,
                "openedAt" => "2024-03-25",
                "nextDeadline" => "2024-06-01",
                "billable" => 3500.00,
                "priority" => "medium",
                "description" => "Comprehensive estate plan including revocable living trust, power of attorney, and healthcare directives.",
                "details" => json_encode([
                    "Tax ID" => "Pending",
                    "Asset Value" => "$2.5M - $5M",
                    "Heirs Count" => "3"
                ])
            ],
            [
                "id" => "c3",
                "number" => "2023-IP-0992",
                "title" => "Whitaker IP Portfolio Audit",
                "client" => "James Whitaker",
                "clientId" => "u4",
                "practice" => "Intellectual Property",
                "stage" => "Review",
                "status" => "active",
                "lead" => "Marcus Hale",
                "court" => null,
                "judge" => null,
                "hearingDate" => null,
                "openedAt" => "2023-11-12",
                "nextDeadline" => "2024-06-10",
                "billable" => 8750.00,
                "priority" => "low",
                "description" => "Ongoing audit of trademark and patent filings for Whitaker Capital's subsidiary tech firms.",
                "details" => json_encode([
                    "Total Patents" => "12",
                    "Trademarks" => "5",
                    "Jurisdiction" => "US & EU"
                ])
            ]
        ];

        foreach ($cases as $case) {
            $case['created_at'] = now();
            $case['updated_at'] = now();
            DB::table('case_models')->insert($case);
        }

        // Link cases to users
        DB::table('users')->where('id', 'u4')->update(['caseIds' => json_encode(['c1', 'c3'])]);
        DB::table('users')->where('id', 'u5')->update(['caseIds' => json_encode(['c2'])]);

        // Tasks
        $tasks = [
            [
                "id" => "t1",
                "caseId" => "c1",
                "title" => "Review medical records",
                "assignee" => "Sofia Reyes",
                "due" => "2024-05-25",
                "priority" => "high",
                "status" => "pending",
                "notes" => "Verify hospital bills from SF General."
            ],
            [
                "id" => "t2",
                "caseId" => "c1",
                "title" => "Draft interrogatories",
                "assignee" => "Marcus Hale",
                "due" => "2024-06-01",
                "priority" => "medium",
                "status" => "pending",
                "notes" => "Standard PI set for city defendants."
            ],
            [
                "id" => "t3",
                "caseId" => "c2",
                "title" => "Finalize Trust draft",
                "assignee" => "Marcus Hale",
                "due" => "2024-05-28",
                "priority" => "high",
                "status" => "in_progress",
                "notes" => "Ensure charitable remainder clause is included."
            ]
        ];

        foreach ($tasks as $task) {
            $task['created_at'] = now();
            $task['updated_at'] = now();
            DB::table('tasks')->insert($task);
        }

        // Events
        $events = [
            [
                "id" => "e1",
                "caseId" => "c1",
                "clientId" => "u4",
                "title" => "Status Conference",
                "date" => "2024-06-15",
                "time" => "09:30",
                "type" => "court",
                "location" => "Dept 302, SF Superior Court",
                "reminder" => "1d",
                "notes" => "Be prepared to discuss discovery timeline."
            ],
            [
                "id" => "e2",
                "caseId" => "c2",
                "clientId" => "u5",
                "title" => "Signing Appointment",
                "date" => "2024-06-05",
                "time" => "14:00",
                "type" => "meeting",
                "location" => "Firm Office, Suite 500",
                "reminder" => "1h",
                "notes" => "Client will bring ID and list of executors."
            ],
            [
                "id" => "e3",
                "caseId" => null,
                "clientId" => null,
                "title" => "Internal Team Sync",
                "date" => "2024-05-22",
                "time" => "11:00",
                "type" => "meeting",
                "location" => "Conference Room B",
                "reminder" => "15m",
                "notes" => "Weekly caseload review."
            ]
        ];

        foreach ($events as $event) {
            $event['created_at'] = now();
            $event['updated_at'] = now();
            DB::table('events')->insert($event);
        }

        // Invoices
        $invoices = [
            [
                "id" => "inv1",
                "number" => "INV-2024-001",
                "caseId" => "c1",
                "clientId" => "u4",
                "client" => "James Whitaker",
                "amount" => 4500.00,
                "issued" => "2024-04-01",
                "due" => "2024-05-01",
                "status" => "paid"
            ],
            [
                "id" => "inv2",
                "number" => "INV-2024-042",
                "caseId" => "c1",
                "clientId" => "u4",
                "client" => "James Whitaker",
                "amount" => 1250.00,
                "issued" => "2024-05-01",
                "due" => "2024-06-01",
                "status" => "outstanding"
            ],
            [
                "id" => "inv3",
                "number" => "INV-2024-055",
                "caseId" => "c2",
                "clientId" => "u5",
                "client" => "Ana Martinez",
                "amount" => 2500.00,
                "issued" => "2024-05-15",
                "due" => "2024-06-15",
                "status" => "pending"
            ]
        ];

        foreach ($invoices as $invoice) {
            $invoice['created_at'] = now();
            $invoice['updated_at'] = now();
            DB::table('invoices')->insert($invoice);
        }

        // Payments (Historical for Analytics)
        $payments = [];
        $months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05'];
        $amounts = [32000, 35000, 31000, 38000, 42500];

        foreach ($months as $index => $month) {
            $count = rand(3, 5);
            for ($i = 0; $i < $count; $i++) {
                $payments[] = [
                    'id' => (string) Str::uuid(),
                    'invoiceId' => 'inv-' . rand(100, 999),
                    'clientId' => rand(0, 1) ? 'u4' : 'u5',
                    'caseId' => rand(0, 1) ? 'c1' : 'c2',
                    'amount' => $amounts[$index] / $count,
                    'method' => 'wire',
                    'status' => 'paid',
                    'paidAt' => $month . '-' . rand(10, 28),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        foreach ($payments as $payment) {
            DB::table('payments')->insert($payment);
        }

        // Settings
        $settings = [
            ['key' => 'firmName', 'value' => 'Vance & Hale Law'],
            ['key' => 'address', 'value' => '500 Sansome St, Suite 500, San Francisco, CA 94111'],
            ['key' => 'phone', 'value' => '+1 (555) 123-4567'],
            ['key' => 'email', 'value' => 'contact@vancehale.law'],
            ['key' => 'website', 'value' => 'https://vancehale.law'],
            ['key' => 'currency', 'value' => 'USD'],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                ['value' => $setting['value'], 'updated_at' => now()]
            );
        }
    }
}
