<?php

namespace App\Http\Controllers;

use App\Models\ProductCategory;
use App\Rules\CategoryHierarchyRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductCategoryController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        abort_unless($request->user()?->can('categories.view'), 403, 'غير مصرح لك بعرض الأصناف.');

        $categories = ProductCategory::with('parent')
            ->withCount('products')
            ->orderBy('name')
            ->get();

        if ($request->wantsJson()) {
            return response()->json($categories);
        }

        return Inertia::render('Products/Categories', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        abort_unless($request->user()?->can('categories.create'), 403, 'غير مصرح لك بإضافة أصناف.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:191'],
            'parent_id' => ['nullable', 'exists:product_categories,id'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $category = ProductCategory::create($data);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم إضافة الصنف بنجاح.', 'category' => $category], 201);
        }

        return back()->with('success', 'تم إضافة الصنف بنجاح.');
    }

    public function update(Request $request, ProductCategory $category): RedirectResponse|JsonResponse
    {
        abort_unless($request->user()?->can('categories.edit'), 403, 'غير مصرح لك بتعديل الأصناف.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:191'],
            'parent_id' => [
                'nullable',
                'exists:product_categories,id',
                new CategoryHierarchyRule($category->id),
            ],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $category->update($data);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم تحديث الصنف بنجاح.', 'category' => $category]);
        }

        return back()->with('success', 'تم تحديث الصنف بنجاح.');
    }

    public function destroy(Request $request, ProductCategory $category): RedirectResponse|JsonResponse
    {
        abort_unless($request->user()?->can('categories.delete'), 403, 'غير مصرح لك بحذف الأصناف.');

        if ($category->children()->exists()) {
            abort(422, 'لا يمكن حذف صنف رئيسي يحتوي على أصناف فرعية.');
        }

        if ($category->products()->exists()) {
            abort(422, 'لا يمكن حذف صنف مرتبط بمنتجات.');
        }

        $category->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم حذف الصنف بنجاح.']);
        }

        return back()->with('success', 'تم حذف الصنف بنجاح.');
    }
}
