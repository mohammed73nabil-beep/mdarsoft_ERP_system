<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Branch;
use App\Models\Business;
use App\Models\ShippingCompany;
use App\Models\Tax;
use App\Models\Treasury;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /**
     * إعدادات الشركة / المنشأة.
     */
    public function business(Request $request): Response
    {
        abort_unless($request->user()?->can('business.view') || $request->user()?->can('settings.business.view'), 403, 'غير مصرح لك بعرض إعدادات الشركة.');

        $business = Business::withCount(['branches', 'fiscalYears'])->first() ?? Business::create([
            'name'                => 'مؤسسة ركن الأجهزة والاتصالات',
            'name_en'             => 'Device Corner Est',
            'tax_number'          => '300000000000003',
            'commercial_register' => '1010000000',
            'phone'               => '0500000000',
            'email'               => 'info@erp.local',
            'address'             => 'المملكة العربية السعودية - الرياض',
            'decimal_places'      => 2,
        ]);

        return Inertia::render('Settings/Business', [
            'business' => $business,
        ]);
    }

    /**
     * تحديث إعدادات الشركة.
     */
    public function updateBusiness(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('business.edit') || $request->user()?->can('settings.business.view'), 403, 'غير مصرح لك بتعديل إعدادات الشركة.');

        $validated = $request->validate([
            'name'                => ['required', 'string', 'max:255'],
            'name_en'             => ['nullable', 'string', 'max:255'],
            'tax_number'          => ['nullable', 'string', 'max:50'],
            'commercial_register' => ['nullable', 'string', 'max:50'],
            'phone'               => ['nullable', 'string', 'max:50'],
            'email'               => ['nullable', 'email', 'max:255'],
            'address'             => ['nullable', 'string', 'max:500'],
            'decimal_places'      => ['required', 'integer', 'min:0', 'max:4'],
        ]);

        $business = Business::first();
        if ($business) {
            $business->update($validated);
        } else {
            Business::create($validated);
        }

        return back()->with('success', 'تم حفظ إعدادات الشركة بنجاح.');
    }

    /**
     * فروع النشاط والمستودعات والخزائن.
     */
    public function branches(Request $request): Response
    {
        abort_unless($request->user()?->can('branches.view') || $request->user()?->can('settings.branches.view'), 403, 'غير مصرح لك بعرض الفروع.');

        $branches = Branch::with(['warehouses', 'business:id,name'])
            ->withCount(['warehouses'])
            ->get();

        return Inertia::render('Settings/Branches', [
            'branches' => $branches,
        ]);
    }

    /**
     * إضافة فرع جديد مع مستودع وخزينة افتراضية.
     */
    public function storeBranch(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('branches.create'), 403, 'غير مصرح لك بإضافة فرع.');

        $validated = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'code'    => ['required', 'string', 'max:50', 'unique:branches,code'],
            'phone'   => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $business = Business::first();

        $branch = Branch::create([
            'business_id' => $business?->id ?? 1,
            'name'        => $validated['name'],
            'code'        => $validated['code'],
            'phone'       => $validated['phone'] ?? null,
            'address'     => $validated['address'] ?? null,
            'is_active'   => true,
        ]);

        // Create default warehouse for this branch
        Warehouse::create([
            'branch_id'   => $branch->id,
            'name'        => "مستودع {$branch->name}",
            'code'        => "WH-{$branch->code}",
            'is_default'  => true,
            'is_active'   => true,
        ]);

        // Create default treasury for this branch
        $cashAccount = Account::where('code', '1111')->first()
            ?? Account::first()
            ?? Account::factory()->create([
                'code' => '1111',
                'name' => 'الصندوق الرئيسي (cash)',
                'name_ar' => 'الصندوق الرئيسي',
                'name_en' => 'Main Cash Box',
                'type' => 'asset',
                'nature' => 'debit',
                'level' => 4,
                'is_parent' => false,
                'is_header' => false,
                'is_system' => true,
            ]);

        Treasury::create([
            'branch_id'   => $branch->id,
            'name'        => "خزينة {$branch->name}",
            'account_id'  => $cashAccount->id,
            'is_default'  => true,
            'is_active'   => true,
        ]);

        return back()->with('success', "تم إنشاء الفرع {$branch->name} وتجهيز المستودع والخزينة بنجاح.");
    }

    /**
     * شركات الشحن.
     */
    public function shippingCompanies(Request $request): Response
    {
        abort_unless($request->user()?->can('settings.shipping_companies.view') || $request->user()?->can('sales.shipments.view'), 403, 'غير مصرح لك بعرض شركات الشحن.');

        $companies = ShippingCompany::orderByDesc('id')->get();

        return Inertia::render('Settings/ShippingCompanies', [
            'companies' => $companies,
        ]);
    }

    /**
     * إضافة أو تعديل شركة شحن.
     */
    public function storeShippingCompany(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('settings.shipping_companies.view') || $request->user()?->can('sales.shipments.view'), 403, 'غير مصرح لك بإدارة شركات الشحن.');

        $validated = $request->validate([
            'id'        => ['nullable', 'exists:shipping_companies,id'],
            'name'      => ['required', 'string', 'max:255'],
            'phone'     => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ]);

        if (!empty($validated['id'])) {
            $company = ShippingCompany::findOrFail($validated['id']);
            $company->update($validated);
            $msg = 'تم تحديث شركة الشحن بنجاح.';
        } else {
            ShippingCompany::create($validated);
            $msg = 'تمت إضافة شركة الشحن بنجاح.';
        }

        return back()->with('success', $msg);
    }

    /**
     * معدلات الضرائب.
     */
    public function taxRates(Request $request): Response
    {
        abort_unless($request->user()?->can('settings.tax_rates.view') || $request->user()?->can('business.view'), 403, 'غير مصرح لك بعرض الضرائب.');

        $taxes = Tax::orderByDesc('id')->get();

        return Inertia::render('Settings/TaxRates', [
            'taxes' => $taxes,
        ]);
    }

    /**
     * إضافة أو تعديل معدل ضريبة.
     */
    public function storeTaxRate(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('settings.tax_rates.view') || $request->user()?->can('business.edit'), 403, 'غير مصرح لك بتعديل الضرائب.');

        $validated = $request->validate([
            'id'        => ['nullable', 'exists:taxes,id'],
            'name'      => ['required', 'string', 'max:255'],
            'rate'      => ['required', 'numeric', 'min:0', 'max:100'],
            'type'      => ['required', 'string', 'in:percentage,fixed'],
            'tax_type'  => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        if (!empty($validated['id'])) {
            $tax = Tax::findOrFail($validated['id']);
            $tax->update($validated);
            $msg = 'تم تحديث معدل الضريبة بنجاح.';
        } else {
            Tax::create($validated);
            $msg = 'تمت إضافة معدل الضريبة بنجاح.';
        }

        return back()->with('success', $msg);
    }
}
