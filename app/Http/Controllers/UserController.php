<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Representative;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * قائمة المستخدمين.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('users.view') || $request->user()?->can('users.list.view'), 403, 'غير مصرح لك بعرض المستخدمين.');

        $currentUser = $request->user();

        $query = User::with(['branch:id,name', 'roles:id,name'])
            ->orderByDesc('id');

        if ($currentUser && !$currentUser->can('branches.view_all') && $currentUser->branch_id) {
            $query->where('branch_id', $currentUser->branch_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        $users = $query->paginate($request->integer('per_page', 15))->withQueryString();

        $branchesQuery = Branch::select('id', 'name');
        if ($currentUser && !$currentUser->can('branches.view_all') && $currentUser->branch_id) {
            $branchesQuery->where('id', $currentUser->branch_id);
        }

        return Inertia::render('Users/Index', [
            'users'    => $users,
            'roles'    => Role::select('id', 'name')->get(),
            'branches' => $branchesQuery->get(),
            'filters'  => $request->only(['search', 'branch_id', 'role']),
        ]);
    }

    /**
     * إضافة مستخدم جديد.
     */
    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('users.create'), 403, 'غير مصرح لك بإضافة مستخدم.');

        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'email'     => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password'  => ['required', 'string', 'min:6'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'role'      => ['required', 'string', 'exists:roles,name'],
            'is_active' => ['boolean'],
        ], [
            'name.required'     => 'الاسم مطلوب.',
            'email.required'    => 'البريد الإلكتروني مطلوب.',
            'email.unique'      => 'البريد الإلكتروني مسجل مسبقاً.',
            'password.required' => 'كلمة المرور مطلوبة.',
            'password.min'      => 'كلمة المرور يجب ألا تقل عن 6 خانات.',
            'role.required'     => 'يجب اختيار دور للمستخدم.',
        ]);

        $user = User::create([
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'password'  => Hash::make($validated['password']),
            'branch_id' => $validated['branch_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $user->assignRole($validated['role']);

        return back()->with('success', "تمت إضافة المستخدم {$user->name} بنجاح.");
    }

    /**
     * تعديل بيانات مستخدم.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()?->can('users.edit'), 403, 'غير مصرح لك بتعديل المستخدم.');

        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'email'     => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password'  => ['nullable', 'string', 'min:6'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'role'      => ['required', 'string', 'exists:roles,name'],
            'is_active' => ['boolean'],
        ]);

        $data = [
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'branch_id' => $validated['branch_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ];

        if (!empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);
        $user->syncRoles([$validated['role']]);

        return back()->with('success', "تم تحديث بيانات المستخدم {$user->name} بنجاح.");
    }

    /**
     * تفعيل / تعطيل حساب المستخدم.
     */
    public function toggleActive(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()?->can('users.edit'), 403, 'غير مصرح لك بتعديل حالة المستخدم.');

        if ($user->id === $request->user()->id) {
            return back()->withErrors(['error' => 'لا يمكنك تعطيل حسابك الحالي.']);
        }

        $user->update(['is_active' => ! $user->is_active]);

        $statusText = $user->is_active ? 'تفعيل' : 'تعطيل';
        return back()->with('success', "تم {$statusText} حساب المستخدم {$user->name} بنجاح.");
    }

    /**
     * شاشة الأدوار والصلاحيات.
     */
    public function rolesIndex(Request $request): Response
    {
        abort_unless($request->user()?->can('roles.view') || $request->user()?->can('users.roles.view'), 403, 'غير مصرح لك بعرض الصلاحيات.');

        $roles = Role::with(['permissions:id,name'])
            ->withCount('users')
            ->get();

        $permissions = Permission::all(['id', 'name']);

        // Group permissions by prefix/module
        $groupedPermissions = [];
        foreach ($permissions as $perm) {
            $parts = explode('.', $perm->name);
            $module = $parts[0] ?? 'عام';
            $groupedPermissions[$module][] = $perm;
        }

        return Inertia::render('Users/Roles', [
            'roles'              => $roles,
            'permissions'        => $permissions,
            'groupedPermissions' => $groupedPermissions,
        ]);
    }

    /**
     * حفظ / تحديث صلاحيات الدور.
     */
    public function rolesStore(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('roles.create') || $request->user()?->can('roles.edit'), 403, 'غير مصرح لك بتعديل الأدوار والصلاحيات.');

        $validated = $request->validate([
            'role_id'     => ['nullable', 'exists:roles,id'],
            'name'        => ['required', 'string', 'max:100'],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        if (!empty($validated['role_id'])) {
            $role = Role::findOrFail($validated['role_id']);
            $role->update(['name' => $validated['name']]);
        } else {
            $role = Role::create([
                'name'       => $validated['name'],
                'guard_name' => 'web',
            ]);
        }

        $role->syncPermissions($validated['permissions'] ?? []);

        return back()->with('success', "تم حفظ صلاحيات الدور {$role->name} بنجاح.");
    }

    /**
     * شاشة المناديب.
     */
    public function representativesIndex(Request $request): Response
    {
        abort_unless($request->user()?->can('users.representatives.view') || $request->user()?->can('representatives.view'), 403, 'غير مصرح لك بعرض المناديب.');

        $representatives = Representative::with(['user:id,name,email,branch_id', 'user.branch:id,name'])
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 15));

        $users = User::where('is_active', true)
            ->select('id', 'name', 'email')
            ->get();

        return Inertia::render('Users/Representatives', [
            'representatives' => $representatives,
            'users'           => $users,
        ]);
    }

    /**
     * إضافة أو تعديل مندوب.
     */
    public function representativesStore(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('users.representatives.view'), 403, 'غير مصرح لك بإدارة المناديب.');

        $validated = $request->validate([
            'id'              => ['nullable', 'exists:representatives,id'],
            'user_id'         => ['nullable', 'exists:users,id'],
            'name'            => ['required', 'string', 'max:255'],
            'phone'           => ['nullable', 'string', 'max:50'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'is_active'       => ['boolean'],
        ]);

        if (!empty($validated['id'])) {
            $rep = Representative::findOrFail($validated['id']);
            $rep->update($validated);
            $msg = 'تم تحديث بيانات المندوب بنجاح.';
        } else {
            Representative::create($validated);
            $msg = 'تمت إضافة المندوب بنجاح.';
        }

        return back()->with('success', $msg);
    }
}
