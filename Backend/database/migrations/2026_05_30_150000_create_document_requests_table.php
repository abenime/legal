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
        Schema::create('document_requests', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('caseId')->nullable();
            $table->string('clientId')->nullable();
            $table->string('requestedBy')->nullable();
            $table->string('assignedTo')->nullable();
            $table->string('priority')->default('medium');
            $table->string('status')->default('open');
            $table->date('dueDate')->nullable();
            $table->string('attachmentPath')->nullable();
            $table->string('attachmentName')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_requests');
    }
};