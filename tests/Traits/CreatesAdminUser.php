<?php

namespace Tests\Traits;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Role;

/**
 * Trait مشترك لإنشاء مستخدم بدور "مدير النظام" في بيئة الاختبار.
 *
 * يستخدم Gate::before لمنح المدير قبول أي can() check بدلاً من
 * إنشاء مئات الصلاحيات الفردية في قاعدة بيانات الاختبار.
 */
trait CreatesAdminUser
{
    /**
     * يُسجَّل تلقائياً في setUp – يمنح مستخدمي دور "مدير النظام" حق تجاوز
     * جميع فحوصات Gate/can().
     */
    protected function setUpAdminGate(): void
    {
        Gate::before(function (User $user, string $ability): ?bool {
            if ($user->hasRole('مدير النظام')) {
                return true;   // تجاوز كل فحوصات can()
            }
            return null;       // تابع الفحوصات الاعتيادية للمستخدمين الآخرين
        });
    }

    /**
     * ينشئ دور "مدير النظام" ثم ينشئ مستخدماً ويُسنده إليه.
     * استدعِ setUpAdminGate() مرة واحدة في setUp() قبل استدعاء هذه الدالة.
     */
    protected function createAdminUser(): User
    {
        Role::firstOrCreate(['name' => 'مدير النظام', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'admin',       'guard_name' => 'web']);

        $user = User::factory()->create();
        $user->assignRole('مدير النظام');

        return $user;
    }

    /**
     * ينشئ مستخدماً عادياً بلا أدوار أو صلاحيات.
     */
    protected function createNoPermUser(): User
    {
        return User::factory()->create();
    }
}
