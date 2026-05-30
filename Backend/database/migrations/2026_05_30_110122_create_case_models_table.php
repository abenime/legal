<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('case_models', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('number');
            $table->string('title');
            $table->string('client');
            $table->string('clientId')->nullable();
            $table->string('practice');
            $table->string('stage');
            $table->string('status');
            $table->string('lead');
            $table->string('court')->nullable();
            $table->string('judge')->nullable();
            $table->date('hearingDate')->nullable();
            $table->date('openedAt');
            $table->date('nextDeadline')->nullable();
            $table->decimal('billable', 10, 2)->default(0);
            $table->string('priority');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('case_models');
    }
};
