<?php

namespace Tests\Feature\PhaseA;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Representative;
use App\Models\ShippingCompany;
use App\Models\Tax;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UsersAndSettingsScreensTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();

        Business::factory()->create();
        $this->branch = Branch::factory()->create(['name' => 'الفرع الرئيسي']);

        $role = Role::findOrCreate('admin', 'web');
        $permissions = [
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'users.list.view', 'users.roles.view', 'users.representatives.view',
            'roles.view', 'roles.create', 'roles.edit',
            'representatives.view',
            'business.view', 'business.edit',
            'settings.business.view', 'settings.branches.view',
            'settings.shipping_companies.view', 'settings.tax_rates.view',
            'branches.view', 'branches.view_all', 'branches.create',
            'sales.shipments.view',
        ];

        foreach ($permissions as $p) {
            Permission::findOrCreate($p, 'web');
        }
        $role->syncPermissions($permissions);

        $this->adminUser = User::factory()->create(['branch_id' => $this->branch->id]);
        $this->adminUser->assignRole('admin');
    }

    public function test_users_index_screen_renders_200(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/users/list');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Users/Index')
            ->has('users')
            ->has('roles')
            ->has('branches')
        );
    }

    public function test_user_store_creates_user_with_role(): void
    {
        $role = Role::findOrCreate('كاشير', 'web');

        $response = $this->actingAs($this->adminUser)->post('/users', [
            'name'      => 'أحمد الكاشير',
            'email'     => 'ahmed.cashier@erp.local',
            'password'  => 'secret123',
            'branch_id' => $this->branch->id,
            'role'      => 'كاشير',
            'is_active' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'name'      => 'أحمد الكاشير',
            'email'     => 'ahmed.cashier@erp.local',
            'branch_id' => $this->branch->id,
        ]);
    }

    public function test_user_toggle_active_status(): void
    {
        $targetUser = User::factory()->create(['is_active' => true]);

        $response = $this->actingAs($this->adminUser)
            ->post("/users/{$targetUser->id}/toggle-active");

        $response->assertRedirect();
        $this->assertFalse($targetUser->fresh()->is_active);
    }

    public function test_roles_index_and_store_permissions(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/users/roles');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Users/Roles')
            ->has('roles')
            ->has('permissions')
        );

        $response = $this->actingAs($this->adminUser)->post('/users/roles', [
            'name'        => 'مشرف مبيعات',
            'permissions' => ['users.view', 'business.view'],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('roles', ['name' => 'مشرف مبيعات']);
    }

    public function test_representatives_index_and_store(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/users/representatives');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Users/Representatives')
            ->has('representatives')
        );

        $response = $this->actingAs($this->adminUser)->post('/users/representatives', [
            'name'            => 'مندوب الرياض 1',
            'phone'           => '0555555555',
            'commission_rate' => 5.5,
            'is_active'       => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('representatives', [
            'name'            => 'مندوب الرياض 1',
            'commission_rate' => 5.5,
        ]);
    }

    public function test_settings_business_screen_and_update(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/settings/business');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Settings/Business')
            ->has('business')
        );

        $response = $this->actingAs($this->adminUser)->post('/settings/business', [
            'name'                => 'مؤسسة ركن الأجهزة المحدثة',
            'tax_number'          => '300099999999993',
            'decimal_places'      => 2,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('businesses', [
            'name'       => 'مؤسسة ركن الأجهزة المحدثة',
            'tax_number' => '300099999999993',
        ]);
    }

    public function test_settings_branches_screen_and_store(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/settings/branches');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Settings/Branches')
            ->has('branches')
        );

        $response = $this->actingAs($this->adminUser)->post('/settings/branches', [
            'name' => 'فرع الدمام',
            'code' => 'DMM',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('branches', [
            'name' => 'فرع الدمام',
            'code' => 'DMM',
        ]);
        $this->assertDatabaseHas('warehouses', [
            'code' => 'WH-DMM',
        ]);
    }

    public function test_settings_shipping_companies_screen_and_store(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/settings/shipping-companies');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Settings/ShippingCompanies')
            ->has('companies')
        );

        $response = $this->actingAs($this->adminUser)->post('/settings/shipping-companies', [
            'name'      => 'سمسا إكسبريس',
            'phone'     => '920009999',
            'is_active' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('shipping_companies', [
            'name' => 'سمسا إكسبريس',
        ]);
    }

    public function test_settings_tax_rates_screen_and_store(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/settings/tax-rates');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Settings/TaxRates')
            ->has('taxes')
        );

        $response = $this->actingAs($this->adminUser)->post('/settings/tax-rates', [
            'name'      => 'ضريبة تجريبية 5%',
            'rate'      => 5.0,
            'type'      => 'percentage',
            'is_active' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('taxes', [
            'name' => 'ضريبة تجريبية 5%',
            'rate' => 5.0,
        ]);
    }
}
