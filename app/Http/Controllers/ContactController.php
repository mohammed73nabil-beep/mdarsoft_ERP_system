<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactRequest;
use App\Http\Requests\UpdateContactRequest;
use App\Models\Contact;
use App\Models\ContactGroup;
use App\Models\ContactLedgerEntry;
use App\Models\FiscalYear;
use App\Models\Representative;
use App\Models\SellingPriceGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    // الموردين (Suppliers)
    // ─────────────────────────────────────────────────────────────────────────

    public function suppliersIndex(Request $request): Response
    {
        abort_unless(
            $request->user()?->can('contacts.suppliers.view') ||
            $request->user()?->can('contacts.view'),
            403,
            'غير مصرح لك بعرض قائمة الموردين.'
        );

        $query = Contact::query()
            ->whereIn('type', ['supplier', 'both'])
            ->with(['group:id,name'])
            ->withSum('ledgerEntries as total_debit', 'debit')
            ->withSum('ledgerEntries as total_credit', 'credit');

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('tax_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('contact_group_id')) {
            $query->where('contact_group_id', $request->input('contact_group_id'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $suppliers = $query->orderBy('name')->paginate(15)->withQueryString();

        // Calculate balance for each supplier
        $suppliers->getCollection()->transform(function ($contact) {
            $debit = (float) ($contact->total_debit ?? 0);
            $credit = (float) ($contact->total_credit ?? 0);
            // For supplier: positive balance = we owe them (credit - debit)
            $contact->current_balance = round($credit - $debit, 4);
            return $contact;
        });

        $groups = ContactGroup::whereIn('type', ['supplier', 'both'])->select('id', 'name')->get();

        return Inertia::render('Contacts/Suppliers/Index', [
            'suppliers' => $suppliers,
            'groups'    => $groups,
            'filters'   => $request->only(['search', 'contact_group_id', 'is_active']),
        ]);
    }

    public function suppliersCreate(Request $request): Response
    {
        abort_unless(
            $request->user()?->can('contacts.suppliers.view') ||
            $request->user()?->can('contacts.view'),
            403,
            'غير مصرح لك بإضافة مورد جديد.'
        );

        $groups = ContactGroup::whereIn('type', ['supplier', 'both'])->select('id', 'name')->get();
        $representatives = Representative::where('is_active', true)->select('id', 'name')->get();

        return Inertia::render('Contacts/Suppliers/Create', [
            'groups'          => $groups,
            'representatives' => $representatives,
        ]);
    }

    public function suppliersStore(StoreContactRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['type'] = $data['type'] ?? 'supplier';

        // Auto generate code if empty
        if (empty($data['code'])) {
            $lastId = Contact::max('id') ?? 0;
            $data['code'] = 'SUP-' . str_pad((string)($lastId + 1), 4, '0', STR_PAD_LEFT);
        }

        $contact = DB::transaction(function () use ($data) {
            $contact = Contact::create($data);

            // Record initial ledger entry if opening balance exists
            $openingBalance = (float) ($data['opening_balance'] ?? 0);
            if ($openingBalance > 0) {
                $fiscalYear = FiscalYear::where('status', 'open')->first() ?? FiscalYear::first();
                $isDebit = ($data['opening_balance_type'] ?? 'credit') === 'debit';

                ContactLedgerEntry::create([
                    'contact_id'     => $contact->id,
                    'fiscal_year_id' => $fiscalYear?->id ?? 1,
                    'date'           => now()->toDateString(),
                    'debit'          => $isDebit ? $openingBalance : 0,
                    'credit'         => $isDebit ? 0 : $openingBalance,
                    'reference_type' => 'opening_balance',
                    'reference_id'   => $contact->id,
                    'description'    => 'رصيد افتتاحي عند إنشاء جهة التعامل',
                    'created_at'     => now(),
                ]);
            }

            return $contact;
        });

        return redirect()->route('contacts.suppliers.show', $contact->id)
            ->with('success', 'تم إضافة المورد بنجاح.');
    }

    public function suppliersShow(Request $request, Contact $contact): Response
    {
        abort_unless(
            $request->user()?->can('contacts.suppliers.view') ||
            $request->user()?->can('contacts.view'),
            403,
            'غير مصرح لك بعرض بيانات المورد.'
        );

        abort_unless($contact->isSupplier(), 404, 'جهة التعامل ليست مورداً.');

        $contact->load([
            'group:id,name',
            'representative:id,name',
            'purchaseOrders' => fn ($q) => $q->latest()->take(10)->select(
                'id', 'order_number', 'contact_id', 'date', 'total_amount', 'paid_amount', 'status', 'payment_status'
            ),
            'purchaseReturns' => fn ($q) => $q->latest()->take(5)->select(
                'id', 'return_number', 'contact_id', 'date', 'total_amount', 'status'
            ),
            'ledgerEntries' => fn ($q) => $q->latest('date')->take(15),
        ]);

        $totalPurchases = (float) $contact->purchaseOrders()->where('status', '!=', 'cancelled')->sum('total_amount');
        $totalPaid = (float) $contact->purchaseOrders()->where('status', '!=', 'cancelled')->sum('paid_amount');
        $currentBalance = (float) $contact->balance;

        return Inertia::render('Contacts/Suppliers/Show', [
            'contact' => $contact,
            'stats'   => [
                'total_purchases' => $totalPurchases,
                'total_paid'      => $totalPaid,
                'current_balance' => $currentBalance,
                'orders_count'    => $contact->purchaseOrders()->count(),
            ],
        ]);
    }

    public function suppliersEdit(Request $request, Contact $contact): Response
    {
        abort_unless(
            $request->user()?->can('contacts.suppliers.view') ||
            $request->user()?->can('contacts.view'),
            403,
            'غير مصرح لك بتعديل بيانات المورد.'
        );

        abort_unless($contact->isSupplier(), 404, 'جهة التعامل ليست مورداً.');

        $groups = ContactGroup::whereIn('type', ['supplier', 'both'])->select('id', 'name')->get();
        $representatives = Representative::where('is_active', true)->select('id', 'name')->get();

        return Inertia::render('Contacts/Suppliers/Edit', [
            'contact'         => $contact,
            'groups'          => $groups,
            'representatives' => $representatives,
        ]);
    }

    public function suppliersUpdate(UpdateContactRequest $request, Contact $contact): RedirectResponse
    {
        $contact->update($request->validated());

        return redirect()->route('contacts.suppliers.show', $contact->id)
            ->with('success', 'تم تحديث بيانات المورد بنجاح.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // العملاء (Customers)
    // ─────────────────────────────────────────────────────────────────────────

    public function customersIndex(Request $request): Response
    {
        abort_unless(
            $request->user()?->can('contacts.customers.view') ||
            $request->user()?->can('contacts.view'),
            403,
            'غير مصرح لك بعرض قائمة العملاء.'
        );

        $query = Contact::query()
            ->whereIn('type', ['customer', 'both'])
            ->with(['group:id,name', 'representative:id,name', 'sellingPriceGroup:id,name'])
            ->withSum('ledgerEntries as total_debit', 'debit')
            ->withSum('ledgerEntries as total_credit', 'credit');

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('tax_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('contact_group_id')) {
            $query->where('contact_group_id', $request->input('contact_group_id'));
        }

        if ($request->filled('selling_price_group_id')) {
            $query->where('selling_price_group_id', $request->input('selling_price_group_id'));
        }

        if ($request->filled('representative_id')) {
            $query->where('representative_id', $request->input('representative_id'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $customers = $query->orderBy('name')->paginate(15)->withQueryString();

        // Calculate balance for each customer
        $customers->getCollection()->transform(function ($contact) {
            $debit = (float) ($contact->total_debit ?? 0);
            $credit = (float) ($contact->total_credit ?? 0);
            // For customer: positive balance = they owe us (debit - credit)
            $contact->current_balance = round($debit - $credit, 4);
            return $contact;
        });

        $groups = ContactGroup::whereIn('type', ['customer', 'both'])->select('id', 'name')->get();
        $sellingPriceGroups = SellingPriceGroup::where('is_active', true)->select('id', 'name')->get();
        $representatives = Representative::where('is_active', true)->select('id', 'name')->get();

        return Inertia::render('Contacts/Customers/Index', [
            'customers'          => $customers,
            'groups'             => $groups,
            'sellingPriceGroups' => $sellingPriceGroups,
            'representatives'    => $representatives,
            'filters'            => $request->only([
                'search', 'contact_group_id', 'selling_price_group_id', 'representative_id', 'is_active'
            ]),
        ]);
    }

    public function customersCreate(Request $request): Response
    {
        abort_unless(
            $request->user()?->can('contacts.customers.view') ||
            $request->user()?->can('contacts.view'),
            403,
            'غير مصرح لك بإضافة عميل جديد.'
        );

        $groups = ContactGroup::whereIn('type', ['customer', 'both'])->select('id', 'name')->get();
        $sellingPriceGroups = SellingPriceGroup::where('is_active', true)->select('id', 'name')->get();
        $representatives = Representative::where('is_active', true)->select('id', 'name')->get();

        return Inertia::render('Contacts/Customers/Create', [
            'groups'             => $groups,
            'sellingPriceGroups' => $sellingPriceGroups,
            'representatives'    => $representatives,
        ]);
    }

    public function customersStore(StoreContactRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['type'] = $data['type'] ?? 'customer';

        // Auto generate code if empty
        if (empty($data['code'])) {
            $lastId = Contact::max('id') ?? 0;
            $data['code'] = 'CUS-' . str_pad((string)($lastId + 1), 4, '0', STR_PAD_LEFT);
        }

        $contact = DB::transaction(function () use ($data) {
            $contact = Contact::create($data);

            // Record initial ledger entry if opening balance exists
            $openingBalance = (float) ($data['opening_balance'] ?? 0);
            if ($openingBalance > 0) {
                $fiscalYear = FiscalYear::where('status', 'open')->first() ?? FiscalYear::first();
                $isCredit = ($data['opening_balance_type'] ?? 'debit') === 'credit';

                ContactLedgerEntry::create([
                    'contact_id'     => $contact->id,
                    'fiscal_year_id' => $fiscalYear?->id ?? 1,
                    'date'           => now()->toDateString(),
                    'debit'          => $isCredit ? 0 : $openingBalance,
                    'credit'         => $isCredit ? $openingBalance : 0,
                    'reference_type' => 'opening_balance',
                    'reference_id'   => $contact->id,
                    'description'    => 'رصيد افتتاحي عند إنشاء جهة التعامل',
                    'created_at'     => now(),
                ]);
            }

            return $contact;
        });

        return redirect()->route('contacts.customers.show', $contact->id)
            ->with('success', 'تم إضافة العميل بنجاح.');
    }

    public function customersShow(Request $request, Contact $contact): Response
    {
        abort_unless(
            $request->user()?->can('contacts.customers.view') ||
            $request->user()?->can('contacts.view'),
            403,
            'غير مصرح لك بعرض بيانات العميل.'
        );

        abort_unless($contact->isCustomer(), 404, 'جهة التعامل ليست عميلاً.');

        $contact->load([
            'group:id,name',
            'representative:id,name',
            'sellingPriceGroup:id,name',
            'ledgerEntries' => fn ($q) => $q->latest('date')->take(15),
        ]);

        $currentBalance = (float) $contact->balance;

        return Inertia::render('Contacts/Customers/Show', [
            'contact' => $contact,
            'stats'   => [
                'current_balance' => $currentBalance,
                'credit_limit'    => (float) $contact->credit_limit,
                'credit_balance'  => max(0, (float) $contact->credit_limit - $currentBalance),
            ],
        ]);
    }

    public function customersEdit(Request $request, Contact $contact): Response
    {
        abort_unless(
            $request->user()?->can('contacts.customers.view') ||
            $request->user()?->can('contacts.view'),
            403,
            'غير مصرح لك بتعديل بيانات العميل.'
        );

        abort_unless($contact->isCustomer(), 404, 'جهة التعامل ليست عميلاً.');

        $groups = ContactGroup::whereIn('type', ['customer', 'both'])->select('id', 'name')->get();
        $sellingPriceGroups = SellingPriceGroup::where('is_active', true)->select('id', 'name')->get();
        $representatives = Representative::where('is_active', true)->select('id', 'name')->get();

        return Inertia::render('Contacts/Customers/Edit', [
            'contact'            => $contact,
            'groups'             => $groups,
            'sellingPriceGroups' => $sellingPriceGroups,
            'representatives'    => $representatives,
        ]);
    }

    public function customersUpdate(UpdateContactRequest $request, Contact $contact): RedirectResponse
    {
        $contact->update($request->validated());

        return redirect()->route('contacts.customers.show', $contact->id)
            ->with('success', 'تم تحديث بيانات العميل بنجاح.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // عمليات مشتركة (Delete, Toggle Active, Statement of Account / Ledger)
    // ─────────────────────────────────────────────────────────────────────────

    public function destroy(Request $request, Contact $contact): RedirectResponse
    {
        $user = $request->user();
        abort_unless(
            $user?->hasRole('admin') ||
            $user?->hasRole('مدير النظام') ||
            $user?->can('contacts.suppliers.view') ||
            $user?->can('contacts.customers.view'),
            403,
            'غير مصرح لك بحذف جهة التعامل.'
        );

        // Check if contact has purchase orders
        if ($contact->purchaseOrders()->exists()) {
            return back()->withErrors([
                'contact' => 'لا يمكن حذف جهة التعامل لوجود أوامر وفواتير شراء مرتبطة بها. يمكنك تعطيلها بدلاً من ذلك.',
            ]);
        }

        // Check if contact has ledger entries other than opening balance
        $hasNonOpeningEntries = $contact->ledgerEntries()
            ->where('reference_type', '!=', 'opening_balance')
            ->exists();

        if ($hasNonOpeningEntries) {
            return back()->withErrors([
                'contact' => 'لا يمكن حذف جهة التعامل لوجود حركات مالية مسجلة في كشف حسابها.',
            ]);
        }

        $isSupplier = $contact->isSupplier();
        $contact->delete();

        $redirectRoute = $isSupplier ? 'contacts.suppliers.index' : 'contacts.customers.index';
        return redirect()->route($redirectRoute)->with('success', 'تم حذف جهة التعامل بنجاح.');
    }

    public function toggleActive(Request $request, Contact $contact): RedirectResponse
    {
        $contact->update(['is_active' => ! $contact->is_active]);

        $statusMsg = $contact->is_active ? 'تم تفعيل جهة التعامل.' : 'تم تعطيل جهة التعامل.';
        return back()->with('success', $statusMsg);
    }

    public function ledger(Request $request, Contact $contact): Response
    {
        abort_unless(
            $request->user()?->can('contacts.suppliers.view') ||
            $request->user()?->can('contacts.customers.view') ||
            $request->user()?->can('contacts.view'),
            403,
            'غير مصرح لك بعرض كشف الحساب.'
        );

        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        // Opening balance before dateFrom
        $prevDebit = 0.0;
        $prevCredit = 0.0;
        if ($dateFrom) {
            $prevDebit = (float) $contact->ledgerEntries()->where('date', '<', $dateFrom)->sum('debit');
            $prevCredit = (float) $contact->ledgerEntries()->where('date', '<', $dateFrom)->sum('credit');
        }

        $openingBalance = ($contact->type === 'supplier')
            ? round($prevCredit - $prevDebit, 4)
            : round($prevDebit - $prevCredit, 4);

        // Query entries in range
        $entriesQuery = $contact->ledgerEntries()->orderBy('date', 'asc')->orderBy('id', 'asc');

        if ($dateFrom) {
            $entriesQuery->where('date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $entriesQuery->where('date', '<=', $dateTo);
        }

        $running = $openingBalance;
        $periodDebit = 0.0;
        $periodCredit = 0.0;

        $entries = $entriesQuery->get()->map(function ($entry) use (&$running, &$periodDebit, &$periodCredit, $contact) {
            $deb = (float) $entry->debit;
            $crd = (float) $entry->credit;

            $periodDebit += $deb;
            $periodCredit += $crd;

            if ($contact->type === 'supplier') {
                $running += ($crd - $deb);
            } else {
                $running += ($deb - $crd);
            }

            $entry->running_balance = round($running, 4);
            return $entry;
        });

        $closingBalance = $running;

        return Inertia::render('Contacts/Ledger/Show', [
            'contact' => $contact->load('group:id,name'),
            'entries' => $entries,
            'summary' => [
                'opening_balance' => $openingBalance,
                'period_debit'    => round($periodDebit, 4),
                'period_credit'   => round($periodCredit, 4),
                'closing_balance' => round($closingBalance, 4),
            ],
            'filters' => [
                'date_from' => $dateFrom,
                'date_to'   => $dateTo,
            ],
        ]);
    }
}
