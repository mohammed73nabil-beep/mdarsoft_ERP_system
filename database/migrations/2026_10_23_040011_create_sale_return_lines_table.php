<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_return_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_return_id')->constrained('sale_returns')->cascadeOnDelete();
            $table->foreignId('original_line_id')->constrained('sale_order_lines');
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->decimal('quantity', 18, 4);
            $table->foreignId('unit_id')->constrained('units');
            $table->decimal('unit_price', 18, 4);
            $table->decimal('return_cost_price', 18, 4);
            $table->decimal('tax_amount', 18, 4)->default(0);
            $table->decimal('total_amount', 18, 4);
            $table->timestamps();

            $table->index(['sale_return_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_return_lines');
    }
};
