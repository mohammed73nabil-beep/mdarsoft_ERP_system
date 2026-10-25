<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_order_id')->constrained('sale_orders')->cascadeOnDelete();
            $table->foreignId('shipping_company_id')->nullable()->constrained('shipping_companies')->nullOnDelete();
            $table->string('tracking_number')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->decimal('shipping_cost', 18, 4)->default(0);
            $table->enum('status', ['pending', 'shipped', 'delivered', 'returned'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['sale_order_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
