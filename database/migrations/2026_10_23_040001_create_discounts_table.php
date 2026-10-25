<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['percentage', 'fixed']);
            $table->decimal('value', 18, 4);
            $table->enum('applies_to', ['all', 'category', 'product', 'contact_group']);
            $table->unsignedBigInteger('target_id')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->decimal('min_amount', 18, 4)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'applies_to', 'target_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discounts');
    }
};
