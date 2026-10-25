<?php

namespace App\Http\Controllers;

use App\Models\SellingPriceGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SellingPriceGroupController extends Controller
{
    /**
     * Display a listing of selling price groups.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $user && ($user->can('selling_price_groups.view') || $user->can('products.selling_price_groups.view') || $user->can('products.view') || $user->hasRole('admin') || $user->roles()->where('name', 'مدير النظام')->exists()),
            403,
            'غير مصرح لك بعرض مجموعات أسعار البيع.'
        );

        $query = SellingPriceGroup::query()
            ->withCount(['productPrices', 'contacts']);

        // Search by name or description
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by is_active status
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        // Sorting
        $sortField = $request->input('sort_by', 'id');
        $sortDirection = $request->input('sort_direction', 'desc');
        $allowedSorts = ['id', 'name', 'description', 'is_active', 'created_at'];

        if (in_array($sortField, $allowedSorts, true)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderByDesc('id');
        }

        // Pagination
        $perPage = (int) $request->input('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $groups = $query->paginate($perPage)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($groups);
        }

        return Inertia::render('Products/SellingPriceGroups', [
            'groups' => $groups,
            'filters' => $request->only(['search', 'is_active', 'sort_by', 'sort_direction', 'per_page']),
        ]);
    }

    /**
     * Store a newly created selling price group.
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $user && ($user->can('selling_price_groups.create') || $user->can('products.create') || $user->hasRole('admin') || $user->roles()->where('name', 'مدير النظام')->exists()),
            403,
            'غير مصرح لك بإضافة مجموعة أسعار بيع.'
        );

        $data = $request->validate([
            'name' => ['required', 'string', 'max:191', 'unique:selling_price_groups,name'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'اسم مجموعة سعر البيع إلزامي.',
            'name.unique' => 'اسم مجموعة سعر البيع مستخدم من قبل.',
            'name.max' => 'اسم مجموعة سعر البيع يجب ألا يتجاوز 191 حرفاً.',
        ]);

        $group = SellingPriceGroup::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'تم إنشاء مجموعة سعر البيع بنجاح.',
                'group' => $group,
            ], 201);
        }

        return back()->with('success', 'تم إنشاء مجموعة سعر البيع بنجاح.');
    }

    /**
     * Update the specified selling price group.
     */
    public function update(Request $request, SellingPriceGroup $sellingPriceGroup): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $user && ($user->can('selling_price_groups.edit') || $user->can('products.edit') || $user->hasRole('admin') || $user->roles()->where('name', 'مدير النظام')->exists()),
            403,
            'غير مصرح لك بتعديل مجموعة أسعار البيع.'
        );

        $data = $request->validate([
            'name' => ['required', 'string', 'max:191', 'unique:selling_price_groups,name,' . $sellingPriceGroup->id],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'اسم مجموعة سعر البيع إلزامي.',
            'name.unique' => 'اسم مجموعة سعر البيع مستخدم من قبل.',
            'name.max' => 'اسم مجموعة سعر البيع يجب ألا يتجاوز 191 حرفاً.',
        ]);

        $sellingPriceGroup->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? $sellingPriceGroup->is_active,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'تم تحديث مجموعة سعر البيع بنجاح.',
                'group' => $sellingPriceGroup,
            ]);
        }

        return back()->with('success', 'تم تحديث مجموعة سعر البيع بنجاح.');
    }

    /**
     * Toggle active status of a selling price group.
     */
    public function toggleActive(Request $request, SellingPriceGroup $sellingPriceGroup): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $user && ($user->can('selling_price_groups.edit') || $user->can('products.edit') || $user->hasRole('admin') || $user->roles()->where('name', 'مدير النظام')->exists()),
            403,
            'غير مصرح لك بتعديل مجموعة أسعار البيع.'
        );

        $sellingPriceGroup->update([
            'is_active' => !$sellingPriceGroup->is_active,
        ]);

        $statusText = $sellingPriceGroup->is_active ? 'تفعيل' : 'تعطيل';

        if ($request->wantsJson()) {
            return response()->json([
                'message' => "تم {$statusText} مجموعة سعر البيع بنجاح.",
                'is_active' => $sellingPriceGroup->is_active,
            ]);
        }

        return back()->with('success', "تم {$statusText} مجموعة سعر البيع بنجاح.");
    }

    /**
     * Remove the specified selling price group.
     */
    public function destroy(Request $request, SellingPriceGroup $sellingPriceGroup): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $user && ($user->can('selling_price_groups.delete') || $user->can('products.delete') || $user->hasRole('admin') || $user->roles()->where('name', 'مدير النظام')->exists()),
            403,
            'غير مصرح لك بحذف مجموعة أسعار البيع.'
        );

        $hasPrices = $sellingPriceGroup->productPrices()->exists();
        $hasContacts = $sellingPriceGroup->contacts()->exists();
        $hasContactGroups = $sellingPriceGroup->contactGroups()->exists();

        if ($hasPrices || $hasContacts || $hasContactGroups) {
            $msg = 'لا يمكن حذف مجموعة أسعار البيع لوجود أسعار منتجات أو عملاء مرتبطين بها.';
            if ($request->wantsJson()) {
                return response()->json(['message' => $msg], 422);
            }
            return back()->with('error', $msg);
        }

        $sellingPriceGroup->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم حذف مجموعة سعر البيع بنجاح.']);
        }

        return back()->with('success', 'تم حذف مجموعة سعر البيع بنجاح.');
    }
}
