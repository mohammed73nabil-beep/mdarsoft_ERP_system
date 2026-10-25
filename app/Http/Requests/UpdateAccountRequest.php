<?php

namespace App\Http\Requests;

use App\Models\Account;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $accountId = $this->route('account') instanceof Account
            ? $this->route('account')->id
            : $this->route('account');

        return [
            'code' => ['required', 'string', 'max:20', Rule::unique('accounts', 'code')->ignore($accountId)],
            'name' => ['nullable', 'string', 'max:191'],
            'name_ar' => ['nullable', 'string', 'max:191'],
            'name_en' => ['nullable', 'string', 'max:191'],
            'type' => ['required', Rule::in(['asset', 'liability', 'equity', 'revenue', 'expense'])],
            'nature' => ['nullable', Rule::in(['debit', 'credit'])],
            'parent_id' => ['nullable', 'exists:accounts,id'],
            'is_header' => ['nullable', 'boolean'],
            'is_parent' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $account = $this->route('account') instanceof Account
                ? $this->route('account')
                : Account::find($this->route('account'));

            if (!$account) {
                return;
            }

            // Prevent changing code of is_system account
            if ($account->is_system && $this->filled('code') && $this->code !== $account->code) {
                $validator->errors()->add('code', 'لا يمكن تعديل كود الحساب النظامي الأساسي.');
            }

            // Prevent self-parenting
            if ($this->filled('parent_id') && (int) $this->parent_id === (int) $account->id) {
                $validator->errors()->add('parent_id', 'لا يمكن أن يكون الحساب أباً لنفسه.');
            }

            // Prevent circular parenting (child cannot become parent of its ancestor)
            if ($this->filled('parent_id') && in_array((int) $this->parent_id, $account->getAllDescendantIds(), true)) {
                $validator->errors()->add('parent_id', 'لا يمكن تعيين حساب فرعي كأب للحساب الحالي لمنع الحلقات الدائرية.');
            }
        });
    }
}
