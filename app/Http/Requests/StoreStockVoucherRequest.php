<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStockVoucherRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) {
            return false;
        }

        $type = $this->input('type');
        if ($type === 'delivery_voucher') {
            return $user->can('inventory.delivery_voucher.view');
        }

        return $user->can('inventory.receiving_voucher.view');
    }

    public function rules(): array
    {
        return [
            'type'         => ['required', 'in:receiving_voucher,delivery_voucher'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'date'         => ['required', 'date'],
            'notes'        => ['nullable', 'string', 'max:1000'],
            'lines'        => ['required', 'array', 'min:1'],
            'lines.*.product_id'        => ['required', 'exists:products,id'],
            'lines.*.variation_id'      => ['nullable', 'exists:product_variations,id'],
            'lines.*.adjusted_quantity' => ['required', 'numeric', 'gt:0'],
            'lines.*.unit_cost'         => ['nullable', 'numeric', 'min:0'],
            'lines.*.serial_id'         => ['nullable', 'exists:product_serials,id'],
            'lines.*.serials'           => ['nullable', 'array'],
            'lines.*.serials.*.serial_number' => ['nullable', 'string', 'max:100'],
            'lines.*.serials.*.imei1'         => ['nullable', 'string', 'max:20'],
            'lines.*.serials.*.imei2'         => ['nullable', 'string', 'max:20'],
            'lines.*.serials.*.cost_price'    => ['nullable', 'numeric', 'min:0'],
            'lines.*.notes'             => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'warehouse_id.required' => 'يرجى اختيار المستودع.',
            'date.required'         => 'يرجى تحديد التاريخ.',
            'lines.required'        => 'يجب إضافة بند واحد على الأقل في السند.',
            'lines.min'             => 'يجب إضافة بند واحد على الأقل في السند.',
            'lines.*.adjusted_quantity.gt' => 'يجب أن تكون الكمية أكبر من الصفر.',
        ];
    }
}
