<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSerialBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('products.create') || $this->user()?->can('products.edit');
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'exists:products,id'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'serials' => ['required', 'array', 'min:1'],
            'serials.*.serial_number' => ['required', 'string', 'max:100', 'distinct', 'unique:product_serials,serial_number'],
            'serials.*.imei1' => ['nullable', 'string', 'max:100', 'distinct', 'unique:product_serials,imei1'],
            'serials.*.imei2' => ['nullable', 'string', 'max:100', 'distinct', 'unique:product_serials,imei2'],
            'serials.*.cost_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'يرجى تحديد المنتج.',
            'warehouse_id.required' => 'يرجى تحديد المستودع.',
            'serials.required' => 'يرجى إدخال جهاز واحد على الأقل.',
            'serials.*.serial_number.required' => 'الرقم التسلسلي مطلوب لكل جهاز.',
            'serials.*.serial_number.unique' => 'الرقم التسلسلي مسجل مسبقاً في النظام.',
            'serials.*.serial_number.distinct' => 'يوجد تكرار للرقم التسلسلي ضمن نفس القائمة المدخلة.',
            'serials.*.imei1.unique' => 'رقم IMEI 1 مسجل مسبقاً في النظام.',
            'serials.*.imei1.distinct' => 'يوجد تكرار لـ IMEI 1 ضمن نفس القائمة المدخلة.',
            'serials.*.imei2.unique' => 'رقم IMEI 2 مسجل مسبقاً في النظام.',
            'serials.*.imei2.distinct' => 'يوجد تكرار لـ IMEI 2 ضمن نفس القائمة المدخلة.',
        ];
    }
}
