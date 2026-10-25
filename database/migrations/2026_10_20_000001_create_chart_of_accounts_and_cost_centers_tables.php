<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cost_centers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->foreignId('parent_id')->nullable()->constrained('cost_centers')->nullOnDelete();
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // 1, 11, 1101, ...
            $table->string('name_ar')->nullable();
            $table->string('name_en')->nullable();
            $table->string('name')->nullable();
            $table->enum('type', ['asset', 'liability', 'equity', 'revenue', 'expense']); // الأصول، الخصوم، حقوق الملكية، الإيرادات، المصروفات
            $table->enum('nature', ['debit', 'credit'])->default('debit'); // طبيعة الحساب: مدين / دائن
            $table->foreignId('parent_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->unsignedTinyInteger('level')->default(1);
            $table->boolean('is_parent')->default(false); // حساب رئيسي تندرج تحته حسابات فرعية
            $table->boolean('is_header')->default(false);
            $table->boolean('is_system')->default(false);
            $table->text('description')->nullable();
            $table->decimal('current_balance', 16, 2)->default(0.00);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
        Schema::dropIfExists('cost_centers');
    }
};
