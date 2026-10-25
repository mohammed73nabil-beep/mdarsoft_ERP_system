<?php

namespace App\Rules;

use App\Models\ProductCategory;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class CategoryHierarchyRule implements ValidationRule
{
    protected ?int $categoryId;

    public function __construct(?int $categoryId = null)
    {
        $this->categoryId = $categoryId;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value)) {
            return;
        }

        $parentId = (int) $value;

        if ($this->categoryId && $parentId === $this->categoryId) {
            $fail('التصنيف لا يمكن أن يكون أباً لنفسه.');
            return;
        }

        if ($this->categoryId) {
            $parent = ProductCategory::find($parentId);
            while ($parent) {
                if ($parent->id === $this->categoryId) {
                    $fail('لا يمكن اختيار تصنيف فرعي كأب لتصنيف أعلى (حلقة هرمية مفرغة).');
                    return;
                }
                $parent = $parent->parent;
            }
        }
    }
}
