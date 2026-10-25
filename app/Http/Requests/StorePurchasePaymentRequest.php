<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchasePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('purchases.list.view') ?? true;
    }

    public function rules(): array
    {
        return [
            'date'              => ['required', 'date'],
            'amount'            => ['required', 'numeric', 'gt:0'],
            'payment_method_id' => ['required', 'exists:payment_methods,id'],
            'treasury_id'       => ['nullable', 'exists:treasuries,id'],
            'bank_account_id'   => ['nullable', 'exists:bank_accounts,id'],
            'reference'         => ['nullable', 'string', 'max:100'],
            'notes'             => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'date.required'              => 'تاريخ الدفعة مطلوب.',
            'amount.required'            => 'مبلغ الدفعة مطلوب.',
            'amount.gt'                  => 'مبلغ الدفعة يجب أن يكون أكبر من الصفر.',
            'payment_method_id.required' => 'يجب تحديد وسيلة الدفع.',
        ];
    }
}
