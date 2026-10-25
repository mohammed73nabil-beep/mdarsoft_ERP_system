<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['single', 'variable', 'service'])->default('single');
            $table->string('name', 191);
            $table->string('sku', 100)->unique();
            $table->string('barcode', 100)->nullable();
            $table->foreignId('category_id')->nullable()->constrained('product_categories')->restrictOnDelete();
            $table->foreignId('brand_id')->nullable()->constrained('brands')->restrictOnDelete();
            $table->foreignId('unit_id')->constrained('units')->restrictOnDelete();
            $table->foreignId('purchase_unit_id')->nullable()->constrained('units')->restrictOnDelete();
            $table->foreignId('warranty_id')->nullable()->constrained('warranties')->restrictOnDelete();
            $table->enum('tracking_type', ['none', 'serial'])->default('none');
            $table->boolean('has_expiry')->default(false);
            $table->decimal('cost_price', 18, 4)->default(0);
            $table->decimal('selling_price', 18, 4)->default(0);
            $table->decimal('min_selling_price', 18, 4)->default(0);
            $table->decimal('reorder_level', 18, 4)->default(0);
            $table->foreignId('tax_id')->nullable()->constrained('taxes')->nullOnDelete();
            $table->foreignId('income_account_id')->nullable()->constrained('accounts')->restrictOnDelete();
            $table->foreignId('cogs_account_id')->nullable()->constrained('accounts')->restrictOnDelete();
            $table->foreignId('inventory_account_id')->nullable()->constrained('accounts')->restrictOnDelete();
            $table->text('description')->nullable();
            $table->string('image', 500)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('sku');
            $table->index('barcode');
            $table->index(['category_id', 'brand_id', 'tracking_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
