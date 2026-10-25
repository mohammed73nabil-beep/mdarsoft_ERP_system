<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        abort_unless($request->user()?->can('brands.view'), 403, 'غير مصرح لك بعرض العلامات التجارية.');

        $brands = Brand::withCount('products')
            ->orderBy('name')
            ->get();

        if ($request->wantsJson()) {
            return response()->json($brands);
        }

        return Inertia::render('Products/Brands', [
            'brands' => $brands,
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        abort_unless($request->user()?->can('brands.create'), 403, 'غير مصرح لك بإضافة علامة تجارية.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:191', 'unique:brands,name'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $brand = Brand::create($data);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم إضافة العلامة التجارية بنجاح.', 'brand' => $brand], 201);
        }

        return back()->with('success', 'تم إضافة العلامة التجارية بنجاح.');
    }

    public function update(Request $request, Brand $brand): RedirectResponse|JsonResponse
    {
        abort_unless($request->user()?->can('brands.edit'), 403, 'غير مصرح لك بتعديل العلامات التجارية.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:191', 'unique:brands,name,' . $brand->id],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $brand->update($data);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم تحديث العلامة التجارية بنجاح.', 'brand' => $brand]);
        }

        return back()->with('success', 'تم تحديث العلامة التجارية بنجاح.');
    }

    public function destroy(Request $request, Brand $brand): RedirectResponse|JsonResponse
    {
        abort_unless($request->user()?->can('brands.delete'), 403, 'غير مصرح لك بحذف العلامات التجارية.');

        if ($brand->products()->exists()) {
            abort(422, 'لا يمكن حذف علامة تجارية مرتبطة بمنتجات.');
        }

        $brand->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم حذف العلامة التجارية بنجاح.']);
        }

        return back()->with('success', 'تم حذف العلامة التجارية بنجاح.');
    }
}
