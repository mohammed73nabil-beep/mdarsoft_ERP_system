<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_serials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->string('serial_number', 100)->unique();
            $table->string('imei1', 20)->nullable()->unique();
            $table->string('imei2', 20)->nullable()->unique();
            $table->enum('status', [
                'in_stock',
                'sold',
                'returned',
                'damaged',
                'transferred',
                'returned_to_supplier',
            ])->default('in_stock');
            $table->foreignId('warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->decimal('cost_price', 18, 4)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'warehouse_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_serials');
    }
};
