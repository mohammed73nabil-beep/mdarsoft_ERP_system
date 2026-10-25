<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreContactGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        return $user->hasRole('مدير النظام') || $user->hasRole('admin') || $user->can('contacts.customer_groups.view');
    }

    public function rules(): array
    {
        return [
            'name'                   => ['required', 'string', 'max:191'],
            'type'                   => ['required', 'in:customer,supplier,both'],
            'discount_percent'       => ['nullable', 'numeric', 'min:0', 'max:100'],
            'selling_price_group_id' => ['nullable', 'exists:selling_price_groups,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم المجموعة مطلوب.',
            'type.required' => 'نوع المجموعة مطلوب.',
            'discount_percent.max' => 'نسبة الخصم لا يمكن أن تتجاوز 100%.',
        ];
    }
}
