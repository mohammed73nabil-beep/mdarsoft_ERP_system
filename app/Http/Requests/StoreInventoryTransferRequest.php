<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInventoryTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('inventory.transfer_create.view') ?? false;
    }

    public function rules(): array
    {
        return [
            'from_warehouse_id' => ['required', 'exists:warehouses,id', 'different:to_warehouse_id'],
            'to_warehouse_id'   => ['required', 'exists:warehouses,id'],
            'date'              => ['required', 'date'],
            'notes'             => ['nullable', 'string', 'max:1000'],
            'lines'             => ['required', 'array', 'min:1'],
            'lines.*.product_id'   => ['required', 'exists:products,id'],
            'lines.*.variation_id' => ['nullable', 'exists:product_variations,id'],
            'lines.*.quantity'     => ['required', 'numeric', 'gt:0'],
            'lines.*.serial_ids'   => ['nullable', 'array'],
            'lines.*.serial_ids.*' => ['exists:product_serials,id'],
            'lines.*.notes'        => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'from_warehouse_id.required'  => 'يرجى اختيار المستودع المصدر.',
            'to_warehouse_id.required'    => 'يرجى اختيار المستودع الوجهة.',
            'from_warehouse_id.different' => 'لا يمكن التحويل لنفس المستودع.',
            'date.required'               => 'يرجى تحديد التاريخ.',
            'lines.required'              => 'يجب إضافة بند واحد على الأقل للتحويل.',
            'lines.min'                   => 'يجب إضافة بند واحد على الأقل للتحويل.',
            'lines.*.quantity.gt'         => 'يجب أن تكون الكمية أكبر من الصفر.',
        ];
    }
}
