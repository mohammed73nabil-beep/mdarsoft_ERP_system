<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_return_line_serials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_return_line_id')->constrained('purchase_return_lines')->cascadeOnDelete();
            $table->foreignId('serial_id')->constrained('product_serials');
            $table->decimal('cost_price', 18, 4);
            $table->timestamps();

            // Note: No UNIQUE on serial_id (ADR-14)
            $table->index(['purchase_return_line_id', 'serial_id'], 'prl_serials_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_return_line_serials');
    }
};
