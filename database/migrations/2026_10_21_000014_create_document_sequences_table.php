<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_sequences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('fiscal_year_id')->constrained('fiscal_years')->cascadeOnDelete();
            $table->string('doc_type', 50);
            $table->string('prefix', 10);
            $table->unsignedInteger('last_number')->default(0);
            $table->unsignedTinyInteger('padding')->default(5);
            $table->timestamps();

            $table->unique(['branch_id', 'fiscal_year_id', 'doc_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_sequences');
    }
};
