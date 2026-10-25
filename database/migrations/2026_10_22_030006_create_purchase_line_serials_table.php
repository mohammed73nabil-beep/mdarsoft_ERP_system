<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_line_serials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_line_id')->constrained('purchase_order_lines')->cascadeOnDelete();
            $table->foreignId('serial_id')->constrained('product_serials');
            $table->timestamps();

            // Note: No UNIQUE on serial_id because a returned device can be re-purchased (ADR-14)
            $table->index(['purchase_order_line_id', 'serial_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_line_serials');
    }
};
