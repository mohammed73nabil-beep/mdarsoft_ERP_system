<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleDraftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('sales.draft_create.view') ?? true;
    }

    public function rules(): array
    {
        return [
            'contact_id'         => ['nullable', 'exists:contacts,id'],
            'branch_id'          => ['required', 'exists:branches,id'],
            'warehouse_id'       => ['required', 'exists:warehouses,id'],
            'date'               => ['required', 'date'],
            'discount_amount'    => ['nullable', 'numeric', 'min:0'],
            'tax_amount'         => ['nullable', 'numeric', 'min:0'],
            'notes'              => ['nullable', 'string', 'max:1000'],
            'lines'              => ['required', 'array', 'min:1'],
            'lines.*.product_id' => ['required', 'exists:products,id'],
            'lines.*.variation_id' => ['nullable', 'exists:product_variations,id'],
            'lines.*.quantity'   => ['required', 'numeric', 'gt:0'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.total_amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
