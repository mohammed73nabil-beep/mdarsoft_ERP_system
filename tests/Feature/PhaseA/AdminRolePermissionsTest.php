<?php

namespace Tests\Feature\PhaseA;

use App\Models\User;
use Database\Seeders\PhaseASeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminRolePermissionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_role_has_all_permissions_and_admin_user_is_configured(): void
    {
        $this->seed(PhaseASeeder::class);

        $adminRole = Role::where('name', 'مدير النظام')->first();
        $this->assertNotNull($adminRole, 'Role مدير النظام must exist');

        $totalPermissions = Permission::count();
        $this->assertGreaterThan(0, $totalPermissions);

        // Check that مدير النظام has all permissions
        $this->assertEquals(
            $totalPermissions,
            $adminRole->permissions()->count(),
            'Role مدير النظام must have all system permissions'
        );

        // Check admin user
        $adminUser = User::where('email', 'admin@erp.local')->first();
        $this->assertNotNull($adminUser, 'Admin user must exist');
        $this->assertTrue($adminUser->hasRole('مدير النظام'));

        // Sample permissions
        $this->assertTrue($adminUser->can('users.create'));
        $this->assertTrue($adminUser->can('pos_sessions.view'));
        $this->assertTrue($adminUser->can('fiscal_years.close'));
    }
}
