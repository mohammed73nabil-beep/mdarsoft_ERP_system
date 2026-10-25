<?php

namespace App\Http\Controllers;

use App\Models\Discount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DiscountController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('sales.discounts.view'), 403, 'غير مصرح لك بعرض الخصومات.');

        $discounts = Discount::orderByDesc('id')->get();

        return Inertia::render('Sales/Discounts', [
            'discounts' => $discounts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:191'],
            'type'       => ['required', 'in:percentage,fixed'],
            'value'      => ['required', 'numeric', 'gt:0'],
            'applies_to' => ['required', 'in:all,category,product,contact_group'],
            'target_id'  => ['nullable', 'integer'],
            'start_date' => ['nullable', 'date'],
            'end_date'   => ['nullable', 'date', 'after_or_equal:start_date'],
            'min_amount' => ['nullable', 'numeric', 'min:0'],
            'is_active'  => ['nullable', 'boolean'],
        ]);

        Discount::create($validated);

        return back()->with('success', 'تم إضافة الخصم بنجاح.');
    }

    public function update(Request $request, Discount $discount): RedirectResponse
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:191'],
            'type'       => ['required', 'in:percentage,fixed'],
            'value'      => ['required', 'numeric', 'gt:0'],
            'applies_to' => ['required', 'in:all,category,product,contact_group'],
            'target_id'  => ['nullable', 'integer'],
            'start_date' => ['nullable', 'date'],
            'end_date'   => ['nullable', 'date', 'after_or_equal:start_date'],
            'min_amount' => ['nullable', 'numeric', 'min:0'],
            'is_active'  => ['nullable', 'boolean'],
        ]);

        $discount->update($validated);

        return back()->with('success', 'تم تحديث بيانات الخصم بنجاح.');
    }

    public function destroy(Discount $discount): RedirectResponse
    {
        $discount->delete();

        return back()->with('success', 'تم حذف الخصم بنجاح.');
    }
}
