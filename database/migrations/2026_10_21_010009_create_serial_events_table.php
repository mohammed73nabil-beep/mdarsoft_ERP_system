<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('serial_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('serial_id')->constrained('product_serials')->restrictOnDelete();
            $table->enum('event_type', [
                'purchased',
                'transferred',
                'sold',
                'returned',
                'damaged',
                'adjusted',
                'returned_to_supplier',
            ]);
            $table->foreignId('from_warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('to_warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->string('from_status', 30);
            $table->string('to_status', 30);
            $table->string('reference_type', 50)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->decimal('unit_cost', 18, 4)->nullable();
            $table->decimal('unit_price', 18, 4)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['serial_id', 'created_at']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('serial_events');
    }
};
