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
        Schema::create('messages', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('caseId')->nullable();
            $table->string('from');
            $table->string('fromName')->nullable();
            $table->string('to')->nullable();
            $table->text('body')->nullable();
            $table->string('subject')->nullable();
            $table->text('preview')->nullable();
            $table->boolean('unread')->default(false);
            $table->boolean('read')->default(false);
            $table->dateTime('at')->nullable();
            $table->dateTime('timestamp')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
