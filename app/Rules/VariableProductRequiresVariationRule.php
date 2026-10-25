<?php

namespace App\Rules;

use App\Exceptions\VariableProductRequiresVariationException;
use App\Models\Product;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class VariableProductRequiresVariationRule implements ValidationRule
{
    protected ?int $productId;
    protected ?string $productType;

    /**
     * @param int|string|null $productIdOrType
     *   - int    → نبحث عن المنتج في DB (للتعديل)
     *   - string → يُستخدم مباشرة كنوع المنتج (للإنشاء، مثل: 'single','variable','service')
     *   - null   → لا فحص
     */
    public function __construct(int|string|null $productIdOrType = null)
    {
        if (is_int($productIdOrType)) {
            $this->productId   = $productIdOrType;
            $this->productType = null;
        } elseif (is_string($productIdOrType)) {
            $this->productId   = null;
            $this->productType = $productIdOrType;
        } else {
            $this->productId   = null;
            $this->productType = null;
        }
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // تحديد نوع المنتج: إما من DB (تعديل) أو من الـ input (إنشاء)
        $type = $this->productType;

        if ($this->productId) {
            $product = Product::find($this->productId);
            $type    = $product?->type;
        }

        if ($type === 'variable' && empty($value)) {
            $fail('المنتجات من النوع المتغير (variable) تتطلب تعريف متغير واحد على الأقل.');
        }
    }

    /**
     * Helper لفحص المنتج والـ variation مباشرة ورمي Exception عند المخالفة.
     *
     * @throws VariableProductRequiresVariationException
     */
    public static function assertValid(Product|int $product, ?int $variationId): void
    {
        $model = $product instanceof Product ? $product : Product::find($product);
        if ($model && $model->isVariable() && empty($variationId)) {
            throw new VariableProductRequiresVariationException(
                "Product [{$model->id}: {$model->name}] is of type 'variable' and requires a non-null variation_id."
            );
        }
    }
}
