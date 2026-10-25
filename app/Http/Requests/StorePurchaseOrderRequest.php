<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('purchases.create.view') ?? true;
    }

    public function rules(): array
    {
        return [
            'contact_id'       => ['required', 'exists:contacts,id'],
            'branch_id'        => ['required', 'exists:branches,id'],
            'warehouse_id'     => ['required', 'exists:warehouses,id'],
            'date'             => ['required', 'date'],
            'notes'            => ['nullable', 'string', 'max:1000'],
            'shipping_amount'  => ['nullable', 'numeric', 'min:0'],
            'auto_receive'     => ['nullable', 'boolean'],
            'lines'            => ['required', 'array', 'min:1'],
            'lines.*.product_id'        => ['required', 'exists:products,id'],
            'lines.*.variation_id'      => ['nullable', 'exists:product_variations,id'],
            'lines.*.unit_id'           => ['nullable', 'exists:units,id'],
            'lines.*.quantity'          => ['required', 'numeric', 'gt:0'],
            'lines.*.unit_cost'         => ['required', 'numeric', 'min:0'],
            'lines.*.discount_amount'   => ['nullable', 'numeric', 'min:0'],
            'lines.*.tax_id'            => ['nullable', 'exists:taxes,id'],
            'lines.*.tax_amount'        => ['nullable', 'numeric', 'min:0'],
            'lines.*.total_amount'      => ['nullable', 'numeric', 'min:0'],
            'lines.*.serial_ids'        => ['nullable', 'array'],
            'lines.*.serial_ids.*'      => ['integer', 'exists:product_serials,id'],
            'lines.*.expiry_date'       => ['nullable', 'date'],
            'lines.*.notes'             => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'contact_id.required'   => 'يجب تحديد المورد.',
            'contact_id.exists'     => 'المورد المحدد غير موجود.',
            'branch_id.required'    => 'يجب تحديد الفرع.',
            'warehouse_id.required' => 'يجب تحديد المستودع.',
            'date.required'         => 'تاريخ الفاتورة مطلوب.',
            'lines.required'        => 'يجب إضافة سطر شراء واحد على الأقل.',
            'lines.min'             => 'يجب إضافة سطر شراء واحد على الأقل.',
            'lines.*.product_id.required' => 'يجب اختيار المنتج لكل سطر.',
            'lines.*.quantity.required'   => 'الكمية مطلوبة.',
            'lines.*.quantity.gt'         => 'الكمية يجب أن تكون أكبر من الصفر.',
            'lines.*.unit_cost.required'  => 'سعر الشراء للوحدة مطلوب.',
        ];
    }
}
