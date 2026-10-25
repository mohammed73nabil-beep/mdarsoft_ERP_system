<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;
use App\Models\Account;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function index(): Response
    {
        $accountsTree = Account::whereNull('parent_id')
            ->with('children')
            ->orderBy('code')
            ->get();

        $flatAccounts = Account::orderBy('code')->get();

        return Inertia::render('Accounts/Index', [
            'accountsTree' => $accountsTree,
            'flatAccounts' => $flatAccounts,
        ]);
    }

    public function store(StoreAccountRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $level = 1;
        if (!empty($validated['parent_id'])) {
            $parent = Account::find($validated['parent_id']);
            if ($parent) {
                $level = $parent->level + 1;
                $validated['type'] = $parent->type;
                if (!$parent->is_parent) {
                    $parent->update(['is_parent' => true]);
                }
            }
        }

        $validated['level'] = $level;
        $validated['is_active'] = $validated['is_active'] ?? true;

        Account::create($validated);

        return redirect()->back();
    }

    public function update(UpdateAccountRequest $request, Account $account): RedirectResponse
    {
        $validated = $request->validated();

        if (!empty($validated['parent_id'])) {
            $parent = Account::find($validated['parent_id']);
            if ($parent) {
                $validated['level'] = $parent->level + 1;
                $validated['type'] = $parent->type;
                if (!$parent->is_parent) {
                    $parent->update(['is_parent' => true]);
                }
            }
        }

        $account->update($validated);

        return redirect()->back();
    }

    public function destroy(Account $account): RedirectResponse
    {
        try {
            $account->delete();
        } catch (DomainException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }

        return redirect()->back();
    }
}
