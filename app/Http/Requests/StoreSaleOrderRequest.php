<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('sales.create.view') ?? true;
    }

    public function rules(): array
    {
        return [
            'contact_id'          => ['nullable', 'exists:contacts,id'],
            'branch_id'           => ['required', 'exists:branches,id'],
            'warehouse_id'        => ['required', 'exists:warehouses,id'],
            'date'                => ['required', 'date'],
            'pos_session_id'      => ['nullable', 'exists:pos_sessions,id'],
            'representative_id'   => ['nullable', 'exists:representatives,id'],
            'shipping_company_id' => ['nullable', 'exists:shipping_companies,id'],
            'discount_id'         => ['nullable', 'exists:discounts,id'],
            'discount_type'       => ['nullable', 'in:percentage,fixed,from_table'],
            'discount_value'      => ['nullable', 'numeric', 'min:0'],
            'shipping_amount'     => ['nullable', 'numeric', 'min:0'],
            'notes'               => ['nullable', 'string', 'max:1000'],
            'source_draft_id'     => ['nullable', 'exists:sale_drafts,id'],
            'source_quotation_id' => ['nullable', 'exists:quotations,id'],
            'payments'            => ['nullable', 'array'],
            'payments.*.amount'   => ['required_with:payments', 'numeric', 'gt:0'],
            'payments.*.payment_method_id' => ['required_with:payments', 'exists:payment_methods,id'],
            'lines'               => ['required', 'array', 'min:1'],
            'lines.*.product_id'        => ['required', 'exists:products,id'],
            'lines.*.variation_id'      => ['nullable', 'exists:product_variations,id'],
            'lines.*.unit_id'           => ['nullable', 'exists:units,id'],
            'lines.*.quantity'          => ['required', 'numeric', 'gt:0'],
            'lines.*.unit_price'        => ['required', 'numeric', 'min:0'],
            'lines.*.discount_type'     => ['nullable', 'in:percentage,fixed,from_table'],
            'lines.*.discount_value'    => ['nullable', 'numeric', 'min:0'],
            'lines.*.discount_amount'   => ['nullable', 'numeric', 'min:0'],
            'lines.*.tax_id'            => ['nullable', 'exists:taxes,id'],
            'lines.*.tax_amount'        => ['nullable', 'numeric', 'min:0'],
            'lines.*.total_amount'      => ['nullable', 'numeric', 'min:0'],
            'lines.*.serial_ids'        => ['nullable', 'array'],
            'lines.*.serial_ids.*'      => ['integer', 'exists:product_serials,id'],
            'lines.*.notes'             => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'branch_id.required'          => 'يجب تحديد الفرع.',
            'warehouse_id.required'       => 'يجب تحديد المستودع.',
            'date.required'               => 'تاريخ الفاتورة مطلوب.',
            'lines.required'              => 'يجب إضافة سطر بيع واحد على الأقل.',
            'lines.min'                   => 'يجب إضافة سطر بيع واحد على الأقل.',
            'lines.*.product_id.required' => 'يجب اختيار المنتج لكل سطر.',
            'lines.*.quantity.required'   => 'الكمية مطلوبة.',
            'lines.*.quantity.gt'         => 'الكمية يجب أن تكون أكبر من الصفر.',
            'lines.*.unit_price.required' => 'سعر البيع للوحدة مطلوب.',
        ];
    }
}
