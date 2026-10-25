<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $accounts = Account::where('is_active', true)
            ->where('is_header', false)
            ->orderBy('code')
            ->take(6)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'totalRevenue' => number_format(0, 2),
                'totalExpenses' => number_format(0, 2),
                'netProfit' => number_format(0, 2),
                'cashBankBalance' => number_format(0, 2),
                'activeAccountsCount' => Account::count(),
                'totalJournalsCount' => 0,
            ],
            'recentAccounts' => $accounts,
        ]);
    }
}
