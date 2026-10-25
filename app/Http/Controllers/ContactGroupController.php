<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactGroupRequest;
use App\Models\ContactGroup;
use App\Models\SellingPriceGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactGroupController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless(
            $request->user()?->can('contacts.customer_groups.view') ||
            $request->user()?->can('contacts.view'),
            403,
            'غير مصرح لك بعرض مجموعات جهات التعامل.'
        );

        $groups = ContactGroup::query()
            ->with(['sellingPriceGroup:id,name'])
            ->withCount('contacts')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $sellingPriceGroups = SellingPriceGroup::where('is_active', true)->select('id', 'name')->get();

        return Inertia::render('Contacts/Groups/Index', [
            'groups'             => $groups,
            'sellingPriceGroups' => $sellingPriceGroups,
        ]);
    }

    public function store(StoreContactGroupRequest $request): RedirectResponse
    {
        ContactGroup::create($request->validated());

        return back()->with('success', 'تم إنشاء مجموعة جهات التعامل بنجاح.');
    }

    public function update(StoreContactGroupRequest $request, ContactGroup $group): RedirectResponse
    {
        $group->update($request->validated());

        return back()->with('success', 'تم تحديث مجموعة جهات التعامل بنجاح.');
    }

    public function destroy(Request $request, ContactGroup $group): RedirectResponse
    {
        $user = $request->user();
        abort_unless(
            $user?->hasRole('admin') ||
            $user?->hasRole('مدير النظام') ||
            $user?->can('contacts.customer_groups.view'),
            403,
            'غير مصرح لك بحذف مجموعة جهات التعامل.'
        );

        if ($group->contacts()->exists()) {
            return back()->withErrors([
                'group' => 'لا يمكن حذف المجموعة لأنها تحتوي على جهات تعامل مرتبطة بها.',
            ]);
        }

        $group->delete();

        return back()->with('success', 'تم حذف مجموعة جهات التعامل بنجاح.');
    }
}
