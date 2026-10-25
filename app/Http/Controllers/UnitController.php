<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        abort_unless($request->user()?->can('units.view'), 403, 'غير مصرح لك بعرض الوحدات.');

        $units = Unit::with('baseUnit')
            ->withCount('products')
            ->orderBy('name')
            ->get();

        if ($request->wantsJson()) {
            return response()->json($units);
        }

        return Inertia::render('Products/Units', [
            'units' => $units,
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        abort_unless($request->user()?->can('units.create'), 403, 'غير مصرح لك بإضافة وحدات.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:units,name'],
            'symbol' => ['nullable', 'string', 'max:20'],
            'base_unit_id' => ['nullable', 'exists:units,id'],
            'operator' => ['nullable', 'in:*,/'],
            'operation_value' => ['nullable', 'numeric', 'min:0.0001'],
            'allow_decimal' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $unit = Unit::create($data);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم إضافة الوحدة بنجاح.', 'unit' => $unit], 201);
        }

        return back()->with('success', 'تم إضافة الوحدة بنجاح.');
    }

    public function update(Request $request, Unit $unit): RedirectResponse|JsonResponse
    {
        abort_unless($request->user()?->can('units.edit'), 403, 'غير مصرح لك بتعديل الوحدات.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:units,name,' . $unit->id],
            'symbol' => ['nullable', 'string', 'max:20'],
            'base_unit_id' => ['nullable', 'exists:units,id', 'different:' . $unit->id],
            'operator' => ['nullable', 'in:*,/'],
            'operation_value' => ['nullable', 'numeric', 'min:0.0001'],
            'allow_decimal' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $unit->update($data);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم تحديث الوحدة بنجاح.', 'unit' => $unit]);
        }

        return back()->with('success', 'تم تحديث الوحدة بنجاح.');
    }

    public function destroy(Request $request, Unit $unit): RedirectResponse|JsonResponse
    {
        abort_unless($request->user()?->can('units.delete'), 403, 'غير مصرح لك بحذف الوحدات.');

        if ($unit->products()->exists() || $unit->subUnits()->exists()) {
            abort(422, 'لا يمكن حذف وحدة مرتبطة بمنتجات أو وحدات أخرى.');
        }

        $unit->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم حذف الوحدة بنجاح.']);
        }

        return back()->with('success', 'تم حذف الوحدة بنجاح.');
    }
}
