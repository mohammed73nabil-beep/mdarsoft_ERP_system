<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReceivePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('purchases.create.view') ?? true;
    }

    public function rules(): array
    {
        return [
            'receive_data'                => ['nullable', 'array'],
            'receive_data.*.serial_ids'   => ['nullable', 'array'],
            'receive_data.*.serial_ids.*' => ['integer', 'exists:product_serials,id'],
        ];
    }
}
