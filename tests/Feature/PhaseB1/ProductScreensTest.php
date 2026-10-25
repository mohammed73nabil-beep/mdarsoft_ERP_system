<?php

namespace Tests\Feature\PhaseB1;

use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductSerial;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warranty;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\CreatesAdminUser;

/**
 * شاشات المنتجات (Inertia + RBAC)
 * يختبر:
 *   1. إرجاع 200 لمن يملك الصلاحية، و403 لمن لا يملكها
 *   2. منع تغيير tracking_type بعد وجود سيريالات
 *   3. CRUD الجداول المساعدة (categories, brands, units, warranties)
 *   4. تفعيل/تعطيل المنتج
 *   5. Quick-Query API
 */
class ProductScreensTest extends TestCase
{
    use RefreshDatabase, CreatesAdminUser;

    private User $admin;
    private User $noPermUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpAdminGate();
        $this->admin      = $this->createAdminUser();
        $this->noPermUser = $this->createNoPermUser();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. قائمة المنتجات
    // ─────────────────────────────────────────────────────────────────────────

    public function test_products_index_returns_200_for_admin(): void
    {
        $response = $this->actingAs($this->admin)->get('/products');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Products/Index'));
    }

    public function test_products_index_returns_403_without_permission(): void
    {
        $this->actingAs($this->noPermUser)->get('/products')->assertStatus(403);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. صفحة إنشاء المنتج
    // ─────────────────────────────────────────────────────────────────────────

    public function test_products_create_page_returns_200_for_admin(): void
    {
        $response = $this->actingAs($this->admin)->get('/products/create');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Products/Create'));
    }

    public function test_products_create_page_returns_403_without_permission(): void
    {
        $this->actingAs($this->noPermUser)->get('/products/create')->assertStatus(403);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. حفظ منتج جديد
    // ─────────────────────────────────────────────────────────────────────────

    public function test_store_product_creates_record(): void
    {
        $unit = Unit::factory()->create();

        $this->actingAs($this->admin)->post('/products', [
            'name'           => 'جهاز اختبار',
            'sku'            => 'TEST-001',
            'type'           => 'single',
            'tracking_type'  => 'none',
            'unit_id'        => $unit->id,
            'cost_price'     => 100,
            'selling_price'  => 150,
            'alert_quantity' => 5,
        ])->assertRedirect();

        $this->assertDatabaseHas('products', ['sku' => 'TEST-001']);
    }

    public function test_store_product_rejects_duplicate_sku(): void
    {
        $unit = Unit::factory()->create();
        Product::factory()->create(['sku' => 'DUP-SKU', 'unit_id' => $unit->id]);

        $this->actingAs($this->admin)->post('/products', [
            'name'          => 'منتج آخر',
            'sku'           => 'DUP-SKU',
            'type'          => 'single',
            'tracking_type' => 'none',
            'unit_id'       => $unit->id,
            'cost_price'    => 50,
            'selling_price' => 80,
        ])->assertSessionHasErrors('sku');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. صفحة تعديل المنتج وعرضه
    // ─────────────────────────────────────────────────────────────────────────

    public function test_edit_product_page_returns_200(): void
    {
        $product = Product::factory()->create();

        $this->actingAs($this->admin)
            ->get("/products/{$product->id}/edit")
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Products/Edit'));
    }

    public function test_edit_product_returns_403_without_permission(): void
    {
        $product = Product::factory()->create();
        $this->actingAs($this->noPermUser)->get("/products/{$product->id}/edit")->assertStatus(403);
    }

    public function test_show_product_page_returns_200(): void
    {
        $product = Product::factory()->create();

        $this->actingAs($this->admin)
            ->get("/products/{$product->id}")
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Products/Show'));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. حماية تغيير tracking_type بعد وجود سيريالات
    // ─────────────────────────────────────────────────────────────────────────

    public function test_update_tracking_type_blocked_after_serials_exist(): void
    {
        $unit    = Unit::factory()->create();
        $product = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id'       => $unit->id,
        ]);

        // سيريال مسجّل = حركة موجودة
        ProductSerial::factory()->create([
            'product_id' => $product->id,
            'status'     => 'in_stock',
        ]);

        $this->actingAs($this->admin)->put("/products/{$product->id}", [
            'name'          => $product->name,
            'sku'           => $product->sku,
            'type'          => $product->type,
            'tracking_type' => 'none',   // محاولة تغيير محظورة
            'unit_id'       => $unit->id,
            'cost_price'    => $product->cost_price,
            'selling_price' => $product->selling_price,
        ])->assertSessionHasErrors('tracking_type');

        $this->assertDatabaseHas('products', [
            'id'            => $product->id,
            'tracking_type' => 'serial',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. تفعيل / تعطيل المنتج
    // ─────────────────────────────────────────────────────────────────────────

    public function test_toggle_active_flips_product_status(): void
    {
        $product = Product::factory()->create(['is_active' => true]);

        $this->actingAs($this->admin)
            ->post("/products/{$product->id}/toggle-active")
            ->assertRedirect();

        $this->assertDatabaseHas('products', ['id' => $product->id, 'is_active' => false]);

        $this->actingAs($this->admin)
            ->post("/products/{$product->id}/toggle-active")
            ->assertRedirect();

        $this->assertDatabaseHas('products', ['id' => $product->id, 'is_active' => true]);
    }

    public function test_toggle_active_returns_403_without_permission(): void
    {
        $product = Product::factory()->create();
        $this->actingAs($this->noPermUser)
            ->post("/products/{$product->id}/toggle-active")
            ->assertStatus(403);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. شاشة السيريالات
    // ─────────────────────────────────────────────────────────────────────────

    public function test_serials_index_returns_200(): void
    {
        $this->actingAs($this->admin)->get('/products/serials')
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Products/Serials'));
    }

    public function test_serials_index_returns_403_without_permission(): void
    {
        $this->actingAs($this->noPermUser)->get('/products/serials')->assertStatus(403);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. جداول مساعدة – Categories
    // ─────────────────────────────────────────────────────────────────────────

    public function test_categories_index_returns_200(): void
    {
        $this->actingAs($this->admin)->get('/products/categories')->assertStatus(200);
    }

    public function test_categories_index_returns_403_without_permission(): void
    {
        $this->actingAs($this->noPermUser)->get('/products/categories')->assertStatus(403);
    }

    public function test_store_category_creates_record(): void
    {
        $this->actingAs($this->admin)
            ->post('/products/categories', ['name' => 'إلكترونيات', 'is_active' => true])
            ->assertRedirect();

        $this->assertDatabaseHas('product_categories', ['name' => 'إلكترونيات']);
    }

    public function test_store_category_fails_without_name(): void
    {
        $this->actingAs($this->admin)
            ->post('/products/categories', [])
            ->assertSessionHasErrors('name');
    }

    public function test_update_category(): void
    {
        $cat = ProductCategory::factory()->create(['name' => 'قديم']);

        $this->actingAs($this->admin)
            ->put("/products/categories/{$cat->id}", ['name' => 'جديد', 'is_active' => true])
            ->assertRedirect();

        $this->assertDatabaseHas('product_categories', ['id' => $cat->id, 'name' => 'جديد']);
    }

    public function test_delete_category_without_products(): void
    {
        $cat = ProductCategory::factory()->create();

        $this->actingAs($this->admin)
            ->delete("/products/categories/{$cat->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('product_categories', ['id' => $cat->id]);
    }

    public function test_delete_category_with_products_fails(): void
    {
        $cat  = ProductCategory::factory()->create();
        $unit = Unit::factory()->create();
        Product::factory()->create(['category_id' => $cat->id, 'unit_id' => $unit->id]);

        $this->actingAs($this->admin)
            ->delete("/products/categories/{$cat->id}")
            ->assertStatus(422);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9. جداول مساعدة – Brands
    // ─────────────────────────────────────────────────────────────────────────

    public function test_brands_index_returns_200(): void
    {
        $this->actingAs($this->admin)->get('/products/brands')->assertStatus(200);
    }

    public function test_store_brand_creates_record(): void
    {
        $this->actingAs($this->admin)
            ->post('/products/brands', ['name' => 'Apple', 'is_active' => true])
            ->assertRedirect();

        $this->assertDatabaseHas('brands', ['name' => 'Apple']);
    }

    public function test_delete_brand_with_products_fails(): void
    {
        $brand = Brand::factory()->create();
        $unit  = Unit::factory()->create();
        Product::factory()->create(['brand_id' => $brand->id, 'unit_id' => $unit->id]);

        $this->actingAs($this->admin)
            ->delete("/products/brands/{$brand->id}")
            ->assertStatus(422);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 10. جداول مساعدة – Units
    // ─────────────────────────────────────────────────────────────────────────

    public function test_units_index_returns_200(): void
    {
        $this->actingAs($this->admin)->get('/products/units')->assertStatus(200);
    }

    public function test_store_unit_creates_record(): void
    {
        $this->actingAs($this->admin)
            ->post('/products/units', ['name' => 'قطعة', 'allow_decimal' => false, 'is_active' => true])
            ->assertRedirect();

        $this->assertDatabaseHas('units', ['name' => 'قطعة']);
    }

    public function test_store_unit_with_conversion(): void
    {
        $base = Unit::factory()->create(['name' => 'قطعة']);

        $this->actingAs($this->admin)->post('/products/units', [
            'name'            => 'كرتون',
            'base_unit_id'    => $base->id,
            'operator'        => '*',
            'operation_value' => 12,
            'is_active'       => true,
        ])->assertRedirect();

        $this->assertDatabaseHas('units', [
            'name'            => 'كرتون',
            'base_unit_id'    => $base->id,
            'operation_value' => 12,
        ]);
    }

    public function test_delete_unit_with_products_fails(): void
    {
        $unit = Unit::factory()->create();
        Product::factory()->create(['unit_id' => $unit->id]);

        $this->actingAs($this->admin)
            ->delete("/products/units/{$unit->id}")
            ->assertStatus(422);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 11. جداول مساعدة – Warranties
    // ─────────────────────────────────────────────────────────────────────────

    public function test_warranties_index_returns_200(): void
    {
        $this->actingAs($this->admin)->get('/products/warranties')->assertStatus(200);
    }

    public function test_store_warranty_creates_record(): void
    {
        $this->actingAs($this->admin)
            ->post('/products/warranties', ['name' => 'ضمان سنة', 'duration_months' => 12])
            ->assertRedirect();

        $this->assertDatabaseHas('warranties', ['name' => 'ضمان سنة', 'duration_months' => 12]);
    }

    public function test_delete_warranty_with_products_fails(): void
    {
        $warranty = Warranty::factory()->create();
        $unit     = Unit::factory()->create();
        Product::factory()->create(['warranty_id' => $warranty->id, 'unit_id' => $unit->id]);

        $this->actingAs($this->admin)
            ->delete("/products/warranties/{$warranty->id}")
            ->assertStatus(422);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 12. Quick-Query API
    // ─────────────────────────────────────────────────────────────────────────

    public function test_quick_query_returns_json(): void
    {
        Product::factory()->count(3)->create();

        $this->actingAs($this->admin)
            ->getJson('/products/quick-query')
            ->assertStatus(200)
            ->assertJsonStructure([['id', 'name', 'sku']]);
    }

    public function test_quick_query_returns_403_without_permission(): void
    {
        $this->actingAs($this->noPermUser)
            ->getJson('/products/quick-query')
            ->assertStatus(403);
    }
}
