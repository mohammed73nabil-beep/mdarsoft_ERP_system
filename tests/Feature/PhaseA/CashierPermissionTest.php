<?php

namespace Tests\Feature\PhaseA;

use App\Models\Branch;
use App\Models\Business;
use App\Models\User;
use Database\Seeders\PhaseASeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CashierPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_cashier_has_limited_permissions_and_cannot_access_user_management(): void
    {
        $this->seed(PhaseASeeder::class);

        $business = Business::first();
        $branch = Branch::first();

        // 1. Create Cashier Role with limited POS permissions
        $cashierRole = Role::firstOrCreate(['name' => 'كاشير', 'guard_name' => 'web']);
        $cashierPermissions = [
            'dashboard.view',
            'pos_sessions.view',
            'pos_sessions.create',
            'pos_sessions.close',
            'sales.view',
        ];

        foreach ($cashierPermissions as $permName) {
            Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'web']);
        }

        $cashierRole->syncPermissions($cashierPermissions);

        // 2. Create Cashier User
        $cashier = User::factory()->create([
            'branch_id' => $branch->id,
            'is_active' => true,
        ]);
        $cashier->assignRole('كاشير');

        // 3. Assert Cashier has assigned permissions
        $this->assertTrue($cashier->can('pos_sessions.view'));
        $this->assertTrue($cashier->can('pos_sessions.create'));

        // 4. Assert Cashier DOES NOT have user management or branch view all permissions
        $this->assertFalse($cashier->can('users.view'), 'الكاشير لا يجب أن يملك صلاحية عرض المستخدمين');
        $this->assertFalse($cashier->can('users.create'), 'الكاشير لا يجب أن يملك صلاحية إنشاء مستخدمين');
        $this->assertFalse($cashier->can('branches.view_all'), 'الكاشير لا يجب أن يملك صلاحية رؤية كافة الفروع');

        // 5. Test frontend menu filtering for Cashier
        $cashierPermsJson = json_encode($cashierPermissions);
        $escapedJson = addslashes($cashierPermsJson);
        $command = "node -e \"import('./resources/js/config/menu.config.js').then(m => { const filtered = m.filterMenuByPermissions(m.menuConfig, {$escapedJson}); const keys = filtered.map(item => item.key); console.log(JSON.stringify(keys)); })\"";

        $output = shell_exec($command);
        $visibleModuleKeys = json_decode(trim($output), true);

        $this->assertIsArray($visibleModuleKeys);
        $this->assertNotContains('users', $visibleModuleKeys, 'وحدة إدارة المستخدمين يجب ألا تظهر للكاشير في القائمة');
    }
}
