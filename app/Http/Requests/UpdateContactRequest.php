<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        $contact = $this->route('contact');
        $user = $this->user();

        if (! $user) {
            return false;
        }

        if ($user->hasRole('مدير النظام') || $user->hasRole('admin')) {
            return true;
        }

        if ($contact && $contact->isSupplier()) {
            return $user->can('contacts.suppliers.view');
        }

        if ($contact && $contact->isCustomer()) {
            return $user->can('contacts.customers.view');
        }

        return $user->can('contacts.view');
    }

    public function rules(): array
    {
        $contactId = $this->route('contact')?->id ?? $this->input('id');

        return [
            'type'                   => ['required', 'in:customer,supplier,both'],
            'name'                   => ['required', 'string', 'max:191'],
            'code'                   => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('contacts', 'code')->ignore($contactId),
            ],
            'phone'                  => ['nullable', 'string', 'max:30'],
            'phone_alt'              => ['nullable', 'string', 'max:30'],
            'email'                  => ['nullable', 'email', 'max:191'],
            'address'                => ['nullable', 'string'],
            'tax_number'             => ['nullable', 'string', 'max:50'],
            'contact_group_id'       => ['nullable', 'exists:contact_groups,id'],
            'representative_id'      => ['nullable', 'exists:representatives,id'],
            'selling_price_group_id' => ['nullable', 'exists:selling_price_groups,id'],
            'credit_limit'           => ['nullable', 'numeric', 'min:0'],
            'opening_balance'        => ['nullable', 'numeric', 'min:0'],
            'opening_balance_type'   => ['nullable', 'in:debit,credit'],
            'is_active'              => ['nullable', 'boolean'],
            'notes'                  => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم جهة التعامل مطلوب.',
            'type.required' => 'نوع جهة التعامل مطلوب.',
            'code.unique'   => 'كود جهة التعامل مستخدم بالفعل.',
            'email.email'   => 'صيغة البريد الإلكتروني غير صحيحة.',
        ];
    }
}
