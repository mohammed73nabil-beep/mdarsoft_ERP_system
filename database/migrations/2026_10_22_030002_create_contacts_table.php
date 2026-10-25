<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['customer', 'supplier', 'both']);
            $table->string('name', 191);
            $table->string('code', 50)->unique()->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('phone_alt', 30)->nullable();
            $table->string('email', 191)->nullable();
            $table->text('address')->nullable();
            $table->string('tax_number', 50)->nullable();
            $table->foreignId('contact_group_id')->nullable()->constrained('contact_groups')->nullOnDelete();
            $table->foreignId('representative_id')->nullable()->constrained('representatives')->nullOnDelete();
            $table->foreignId('selling_price_group_id')->nullable()->constrained('selling_price_groups')->nullOnDelete();
            $table->decimal('credit_limit', 18, 4)->default(0);
            $table->decimal('opening_balance', 18, 4)->default(0);
            $table->enum('opening_balance_type', ['debit', 'credit'])->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['type', 'contact_group_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};
