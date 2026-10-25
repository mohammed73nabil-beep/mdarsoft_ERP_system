<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('symbol', 20)->nullable();           // رمز الوحدة (pcs, kg, ...)
            $table->foreignId('base_unit_id')->nullable()->constrained('units')->restrictOnDelete();
            $table->enum('operator', ['*', '/'])->default('*');  // عملية التحويل ضرب أو قسمة
            $table->decimal('operation_value', 18, 4)->nullable(); // قيمة التحويل (NULL = وحدة أساسية)
            $table->boolean('allow_decimal')->default(true);     // هل يسمح بالكسور؟
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
