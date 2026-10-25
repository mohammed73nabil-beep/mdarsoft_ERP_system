<?php

namespace Tests\Feature\PhaseB1;

use App\Exceptions\VariableProductRequiresVariationException;
use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductPriceGroupPrice;
use App\Models\ProductVariation;
use App\Models\SellingPriceGroup;
use App\Models\Unit;
use App\Models\Warranty;
use App\Rules\CategoryHierarchyRule;
use App\Rules\VariableProductRequiresVariationRule;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;
use Tests\TestCase;

class ProductCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_prevent_duplicate_product_sku(): void
    {
        Product::factory()->create(['sku' => 'SKU-UNIQUE-101']);

        $this->expectException(QueryException::class);
        Product::factory()->create(['sku' => 'SKU-UNIQUE-101']);
    }

    public function test_prevent_duplicate_product_variation_sku(): void
    {
        $product = Product::factory()->variable()->create();

        ProductVariation::factory()->create([
            'product_id' => $product->id,
            'sku' => 'VAR-UNIQUE-202',
        ]);

        $this->expectException(QueryException::class);
        ProductVariation::factory()->create([
            'product_id' => $product->id,
            'sku' => 'VAR-UNIQUE-202',
        ]);
    }

    public function test_prevent_self_parenting_in_product_categories(): void
    {
        $category = ProductCategory::factory()->create();

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('A category cannot be its own parent.');

        $category->parent_id = $category->id;
        $category->save();
    }

    public function test_prevent_circular_loop_in_product_categories(): void
    {
        $catA = ProductCategory::factory()->create(['name' => 'A']);
        $catB = ProductCategory::factory()->create(['name' => 'B', 'parent_id' => $catA->id]);
        $catC = ProductCategory::factory()->create(['name' => 'C', 'parent_id' => $catB->id]);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Circular loop detected in category hierarchy.');

        // Attempting to make A a child of C (A -> B -> C -> A)
        $catA->parent_id = $catC->id;
        $catA->save();
    }

    public function test_category_hierarchy_validation_rule(): void
    {
        $catA = ProductCategory::factory()->create(['name' => 'Root']);
        $catB = ProductCategory::factory()->create(['name' => 'Sub', 'parent_id' => $catA->id]);

        // Self parent rule
        $validator1 = Validator::make(
            ['parent_id' => $catA->id],
            ['parent_id' => [new CategoryHierarchyRule($catA->id)]]
        );
        $this->assertTrue($validator1->fails());

        // Descendant loop rule
        $validator2 = Validator::make(
            ['parent_id' => $catB->id],
            ['parent_id' => [new CategoryHierarchyRule($catA->id)]]
        );
        $this->assertTrue($validator2->fails());

        // Valid parent
        $catOther = ProductCategory::factory()->create(['name' => 'Other']);
        $validator3 = Validator::make(
            ['parent_id' => $catOther->id],
            ['parent_id' => [new CategoryHierarchyRule($catA->id)]]
        );
        $this->assertTrue($validator3->passes());
    }

    public function test_variable_product_requires_variation_exception(): void
    {
        $single = Product::factory()->create(['type' => 'single']);
        $variable = Product::factory()->variable()->create();

        // Single product does not require variation
        VariableProductRequiresVariationRule::assertValid($single, null);

        // Variable product with variation is valid
        VariableProductRequiresVariationRule::assertValid($variable, 5);

        // Variable product without variation throws exception
        $this->expectException(VariableProductRequiresVariationException::class);
        VariableProductRequiresVariationRule::assertValid($variable, null);
    }

    public function test_prevent_duplicate_product_price_group_price_with_null_variation(): void
    {
        $product = Product::factory()->create();
        $group = SellingPriceGroup::factory()->create();

        // First row with variation_id = NULL
        ProductPriceGroupPrice::create([
            'product_id' => $product->id,
            'variation_id' => null,
            'selling_price_group_id' => $group->id,
            'price' => 150.00,
        ]);

        // Second row with same product_id, group_id, and variation_id = NULL must be rejected by variation_key unique constraint
        $this->expectException(QueryException::class);
        ProductPriceGroupPrice::create([
            'product_id' => $product->id,
            'variation_id' => null,
            'selling_price_group_id' => $group->id,
            'price' => 200.00,
        ]);
    }
}
