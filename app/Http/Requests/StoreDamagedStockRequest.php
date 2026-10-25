<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDamagedStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('inventory.damaged_create.view') ?? false;
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
            'lines.*.unit_cost'    => ['nullable', 'numeric', 'min:0'],
            'lines.*.serial_ids'   => ['nullable', 'array'],
            'lines.*.serial_ids.*' => ['exists:product_serials,id'],
            'lines.*.notes'        => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'warehouse_id.required' => 'يرجى اختيار المستودع.',
            'date.required'         => 'يرجى تحديد التاريخ.',
            'lines.required'        => 'يجب إضافة بند واحد على الأقل في سند التالف.',
            'lines.min'             => 'يجب إضافة بند واحد على الأقل في سند التالف.',
            'lines.*.quantity.gt'   => 'يجب أن تكون الكمية أكبر من الصفر.',
        ];
    }
}
