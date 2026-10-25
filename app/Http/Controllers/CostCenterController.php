<?php

namespace App\Http\Controllers;

use App\Models\CostCenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CostCenterController extends Controller
{
    public function index(): Response
    {
        $costCentersTree = CostCenter::whereNull('parent_id')
            ->with('children')
            ->orderBy('code')
            ->get();

        $flatCenters = CostCenter::orderBy('code')->get();

        return Inertia::render('CostCenters/Index', [
            'costCentersTree' => $costCentersTree,
            'flatCenters' => $flatCenters,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'unique:cost_centers,code'],
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'exists:cost_centers,id'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $validated['is_active'] = true;

        CostCenter::create($validated);

        return redirect()->back();
    }
}
