<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_return_line_serials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_return_line_id')->constrained('sale_return_lines')->cascadeOnDelete();
            $table->foreignId('serial_id')->constrained('product_serials');
            $table->decimal('cost_price', 18, 4);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['sale_return_line_id', 'serial_id']);
            $table->index('serial_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_return_line_serials');
    }
};
