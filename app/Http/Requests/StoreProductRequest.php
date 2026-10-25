<?php

namespace App\Http\Requests;

use App\Rules\VariableProductRequiresVariationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('products.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['single', 'variable', 'service'])],
            'name' => ['required', 'string', 'max:191'],
            'sku' => ['required', 'string', 'max:100', 'unique:products,sku'],
            'barcode' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'exists:product_categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'unit_id' => ['required', 'exists:units,id'],
            'purchase_unit_id' => ['nullable', 'exists:units,id'],
            'warranty_id' => ['nullable', 'exists:warranties,id'],
            'tracking_type' => ['required', Rule::in(['none', 'serial'])],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'min_selling_price' => ['nullable', 'numeric', 'min:0'],
            'reorder_level' => ['nullable', 'numeric', 'min:0'],
            'tax_id' => ['nullable', 'exists:taxes,id'],
            'income_account_id' => ['nullable', 'exists:accounts,id'],
            'cogs_account_id' => ['nullable', 'exists:accounts,id'],
            'inventory_account_id' => ['nullable', 'exists:accounts,id'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable'],
            'is_active' => ['nullable', 'boolean'],

            // Variable product rules
            'variations' => [
                'nullable',
                'array',
                new VariableProductRequiresVariationRule($this->input('type', 'single')),
            ],
            'variations.*.name' => ['required_with:variations', 'string', 'max:191'],
            'variations.*.sku' => ['required_with:variations', 'string', 'max:100', 'distinct', 'unique:product_variations,sku'],
            'variations.*.barcode' => ['nullable', 'string', 'max:100'],
            'variations.*.cost_price' => ['nullable', 'numeric', 'min:0'],
            'variations.*.selling_price' => ['nullable', 'numeric', 'min:0'],

            // Selling price groups
            'price_group_prices' => ['nullable', 'array'],
            'price_group_prices.*.selling_price_group_id' => ['required_with:price_group_prices', 'exists:selling_price_groups,id'],
            'price_group_prices.*.price' => ['required_with:price_group_prices', 'numeric', 'min:0'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->input('type') === 'service' && $this->input('tracking_type') !== 'none') {
                $validator->errors()->add('tracking_type', 'خدمات لا يمكن تتبعها بالسيريال.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم المنتج مطلوب.',
            'sku.required' => 'رمز SKU مطلوب.',
            'sku.unique' => 'رمز SKU مسجل مسبقاً لمستخدم آخر أو منتج آخر.',
            'unit_id.required' => 'يرجى اختيار الوحدة الأساسية للمنتج.',
            'cost_price.required' => 'سعر التكلفة (الشراء) مطلوب.',
            'selling_price.required' => 'سعر البيع مطلوب.',
            'variations.*.sku.unique' => 'رمز SKU للمتغير مسجل مسبقاً.',
        ];
    }
}
