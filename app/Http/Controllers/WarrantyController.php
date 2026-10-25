<?php

namespace App\Http\Controllers;

use App\Models\Warranty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WarrantyController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        abort_unless($request->user()?->can('warranties.view'), 403, 'غير مصرح لك بعرض الضمانات.');

        $warranties = Warranty::withCount('products')
            ->orderBy('name')
            ->get();

        if ($request->wantsJson()) {
            return response()->json($warranties);
        }

        return Inertia::render('Products/Warranties', [
            'warranties' => $warranties,
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        abort_unless($request->user()?->can('warranties.create'), 403, 'غير مصرح لك بإضافة ضمان.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:191', 'unique:warranties,name'],
            'duration_months' => ['required', 'integer', 'min:0'],
            'terms' => ['nullable', 'string'],
        ]);

        $warranty = Warranty::create($data);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم إضافة الضمان بنجاح.', 'warranty' => $warranty], 201);
        }

        return back()->with('success', 'تم إضافة الضمان بنجاح.');
    }

    public function update(Request $request, Warranty $warranty): RedirectResponse|JsonResponse
    {
        abort_unless($request->user()?->can('warranties.edit'), 403, 'غير مصرح لك بتعديل الضمانات.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:191', 'unique:warranties,name,' . $warranty->id],
            'duration_months' => ['required', 'integer', 'min:0'],
            'terms' => ['nullable', 'string'],
        ]);

        $warranty->update($data);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم تحديث الضمان بنجاح.', 'warranty' => $warranty]);
        }

        return back()->with('success', 'تم تحديث الضمان بنجاح.');
    }

    public function destroy(Request $request, Warranty $warranty): RedirectResponse|JsonResponse
    {
        abort_unless($request->user()?->can('warranties.delete'), 403, 'غير مصرح لك بحذف الضمانات.');

        if ($warranty->products()->exists()) {
            abort(422, 'لا يمكن حذف ضمان مرتبط بمنتجات.');
        }

        $warranty->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم حذف الضمان بنجاح.']);
        }

        return back()->with('success', 'تم حذف الضمان بنجاح.');
    }
}
