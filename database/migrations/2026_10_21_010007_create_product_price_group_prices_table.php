<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_price_group_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variation_id')->nullable()->constrained('product_variations')->cascadeOnDelete();
            $table->unsignedBigInteger('variation_key')->storedAs('COALESCE(variation_id, 0)');
            $table->foreignId('selling_price_group_id')->constrained('selling_price_groups')->cascadeOnDelete();
            $table->decimal('price', 18, 4);
            $table->timestamps();

            $table->unique(['product_id', 'selling_price_group_id', 'variation_key'], 'ppgp_prod_group_var_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_price_group_prices');
    }
};
