<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class BranchScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (auth()->check()) {
            $user = auth()->user();
            // Users without the 'branches.view_all' permission are scoped to their own branch
            if (!$user->can('branches.view_all')) {
                $builder->where($model->getTable() . '.branch_id', $user->branch_id);
            }
        }
    }
}
