<?php

namespace App\Models;

use DomainException;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;

class Account extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'name_ar',
        'name_en',
        'type',
        'nature',
        'parent_id',
        'level',
        'is_parent',
        'is_header',
        'is_system',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_parent' => 'boolean',
        'is_header' => 'boolean',
        'is_system' => 'boolean',
        'is_active' => 'boolean',
        'level' => 'integer',
    ];

    protected static function booted(): void
    {
        static::saving(function ($account) {
            // Prevent self-parenting
            if ($account->id && $account->parent_id && (int) $account->parent_id === (int) $account->id) {
                throw new DomainException('لا يمكن أن يكون الحساب أباً لنفسه.');
            }

            // Prevent circular parenting (making a child account the parent)
            if ($account->id && $account->parent_id) {
                if (in_array((int) $account->parent_id, $account->getAllDescendantIds(), true)) {
                    throw new DomainException('لا يمكن تعيين حساب فرعي كأب للحساب الحالي لمنع الحلقات الدائرية.');
                }
            }

            // Sync name and name_ar if one is missing
            if (empty($account->name) && !empty($account->name_ar)) {
                $account->name = $account->name_ar;
            } elseif (empty($account->name_ar) && !empty($account->name)) {
                $account->name_ar = $account->name;
            }
        });

        static::updating(function ($account) {
            // Prevent changing code of system accounts
            if ($account->is_system && $account->isDirty('code')) {
                throw new DomainException('لا يمكن تغيير كود الحساب النظامي الأساسي.');
            }
        });

        static::deleting(function ($account) {
            // Prevent deleting system accounts
            if ($account->is_system) {
                throw new DomainException('لا يمكن حذف الحساب النظامي الأساسي.');
            }

            // Prevent deleting account with children
            if ($account->children()->exists()) {
                throw new DomainException('لا يمكن حذف حساب تندرج تحته حسابات فرعية.');
            }

            // Prepared for future journal_lines check
            if (Schema::hasTable('journal_lines')) {
                if ($account->journalLines()->exists()) {
                    throw new DomainException('لا يمكن حذف حساب مرتبط بقيود يومية.');
                }
            }
        });
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Account::class, 'parent_id');
    }

    public function journalLines(): HasMany
    {
        // Reserved for Phase D
        return $this->hasMany(JournalLine::class, 'account_id');
    }

    /**
     * Recursively retrieve all descendant account IDs
     */
    public function getAllDescendantIds(): array
    {
        $descendantIds = [];
        $children = static::where('parent_id', $this->id)->get();

        foreach ($children as $child) {
            $descendantIds[] = (int) $child->id;
            $descendantIds = array_merge($descendantIds, $child->getAllDescendantIds());
        }

        return $descendantIds;
    }
}
