<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('purchases.returns_list.view') ?? true;
    }

    public function rules(): array
    {
        return [
            'original_purchase_id' => ['required', 'exists:purchase_orders,id'],
            'branch_id'            => ['required', 'exists:branches,id'],
            'warehouse_id'         => ['required', 'exists:warehouses,id'],
            'date'                 => ['required', 'date'],
            'notes'                => ['nullable', 'string', 'max:1000'],
            'lines'                => ['required', 'array', 'min:1'],
            'lines.*.original_line_id' => ['required', 'exists:purchase_order_lines,id'],
            'lines.*.product_id'        => ['required', 'exists:products,id'],
            'lines.*.variation_id'      => ['nullable', 'exists:product_variations,id'],
            'lines.*.quantity'          => ['required', 'numeric', 'gt:0'],
            'lines.*.unit_cost'         => ['required', 'numeric', 'min:0'],
            'lines.*.tax_amount'        => ['nullable', 'numeric', 'min:0'],
            'lines.*.total_amount'      => ['required', 'numeric', 'min:0'],
            'lines.*.serial_ids'        => ['nullable', 'array'],
            'lines.*.serial_ids.*'      => ['integer', 'exists:product_serials,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'original_purchase_id.required' => 'يجب تحديد فاتورة الشراء الأصلية.',
            'date.required'                 => 'تاريخ المرتجع مطلوب.',
            'lines.required'                => 'يجب تحديد سطر مرتجع واحد على الأقل.',
            'lines.min'                     => 'يجب تحديد سطر مرتجع واحد على الأقل.',
        ];
    }
}
