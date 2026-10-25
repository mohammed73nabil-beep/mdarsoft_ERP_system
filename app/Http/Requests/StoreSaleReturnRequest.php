<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('sales.returns_list.view') ?? true;
    }

    public function rules(): array
    {
        return [
            'original_sale_id'          => ['required', 'exists:sale_orders,id'],
            'date'                      => ['required', 'date'],
            'branch_id'                 => ['nullable', 'exists:branches,id'],
            'warehouse_id'              => ['nullable', 'exists:warehouses,id'],
            'refund_method'             => ['nullable', 'in:cash,credit,replacement'],
            'accept_into_stock'         => ['nullable', 'boolean'],
            'notes'                     => ['nullable', 'string', 'max:1000'],
            'lines'                     => ['required', 'array', 'min:1'],
            'lines.*.original_line_id'  => ['required', 'exists:sale_order_lines,id'],
            'lines.*.product_id'        => ['required', 'exists:products,id'],
            'lines.*.variation_id'      => ['nullable', 'exists:product_variations,id'],
            'lines.*.quantity'          => ['required', 'numeric', 'gt:0'],
            'lines.*.unit_price'        => ['required', 'numeric', 'min:0'],
            'lines.*.tax_amount'        => ['nullable', 'numeric', 'min:0'],
            'lines.*.total_amount'      => ['required', 'numeric', 'min:0'],
            'lines.*.serial_ids'        => ['nullable', 'array'],
            'lines.*.serial_ids.*'      => ['integer', 'exists:product_serials,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'original_sale_id.required' => 'يجب تحديد فاتورة البيع الأصلية.',
            'date.required'             => 'تاريخ المرتجع مطلوب.',
            'lines.required'            => 'يجب تحديد سطر واحد على الأقل للإرجاع.',
            'lines.min'                 => 'يجب تحديد سطر واحد على الأقل للإرجاع.',
        ];
    }
}
