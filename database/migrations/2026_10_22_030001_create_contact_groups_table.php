<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name', 191);
            $table->enum('type', ['customer', 'supplier', 'both']);
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->foreignId('selling_price_group_id')->nullable()->constrained('selling_price_groups')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_groups');
    }
};
