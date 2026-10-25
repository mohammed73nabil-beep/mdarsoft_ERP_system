<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOpeningStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('products.add_opening_stock.view') ?? false;
    }

    public function rules(): array
    {
        return [
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'date'         => ['required', 'date'],
            'notes'        => ['nullable', 'string', 'max:1000'],
            'lines'        => ['required', 'array', 'min:1'],
            'lines.*.product_id'   => ['required', 'exists:products,id'],
            'lines.*.variation_id' => ['nullable', 'exists:product_variations,id'],
            'lines.*.quantity'     => ['required', 'numeric', 'gt:0'],
            'lines.*.unit_cost'    => ['required', 'numeric', 'min:0'],
            'lines.*.serials'      => ['nullable', 'array'],
            'lines.*.serials.*.serial_number' => ['nullable', 'string', 'max:100'],
            'lines.*.serials.*.imei1'         => ['nullable', 'string', 'max:20'],
            'lines.*.serials.*.imei2'         => ['nullable', 'string', 'max:20'],
            'lines.*.serials.*.cost_price'    => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'warehouse_id.required' => 'يرجى اختيار المستودع.',
            'date.required'         => 'يرجى تحديد التاريخ.',
            'lines.required'        => 'يجب إضافة صنف واحد على الأقل في السند.',
            'lines.min'             => 'يجب إضافة صنف واحد على الأقل في السند.',
            'lines.*.quantity.gt'   => 'يجب أن تكون الكمية أكبر من الصفر.',
            'lines.*.unit_cost.min' => 'يجب ألا تكون التكلفة سالبة.',
        ];
    }
}
