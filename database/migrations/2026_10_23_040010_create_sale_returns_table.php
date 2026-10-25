<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_returns', function (Blueprint $table) {
            $table->id();
            $table->string('return_number', 30)->unique();
            $table->date('date');
            $table->foreignId('fiscal_year_id')->constrained('fiscal_years');
            $table->foreignId('original_sale_id')->constrained('sale_orders');
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('total_amount', 18, 4);
            $table->decimal('tax_amount', 18, 4)->default(0);
            $table->enum('status', ['draft', 'confirmed', 'cancelled'])->default('draft');
            $table->enum('refund_method', ['cash', 'credit', 'replacement'])->default('cash');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['original_sale_id', 'date', 'status']);
            $table->index(['contact_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_returns');
    }
};
