<?php

namespace App\Models;

use App\Exceptions\OpenPosSessionExistsException;
use App\Traits\BelongsToBranch;
use App\Traits\ValidatesFiscalYear;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosSession extends Model
{
    use HasFactory, BelongsToBranch, ValidatesFiscalYear;

    protected $fillable = [
        'session_number',
        'branch_id',
        'warehouse_id',
        'treasury_id',
        'user_id',
        'fiscal_year_id',
        'opened_at',
        'closed_at',
        'opening_balance',
        'expected_closing',
        'actual_closing',
        'difference',
        'status',
        'notes',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'opening_balance' => 'decimal:4',
        'expected_closing' => 'decimal:4',
        'actual_closing' => 'decimal:4',
        'difference' => 'decimal:4',
    ];

    protected static function booted(): void
    {
        static::creating(function ($posSession) {
            $hasOpenSession = static::withoutGlobalScopes()
                ->where('user_id', $posSession->user_id)
                ->where('status', 'open')
                ->exists();

            if ($hasOpenSession) {
                throw new OpenPosSessionExistsException('لا يمكن فتح جلسة نقطة بيع جديدة قبل إغلاق الجلسة السابقة.');
            }

            if (empty($posSession->expected_closing)) {
                $posSession->expected_closing = $posSession->opening_balance ?? 0;
            }
        });
    }

    public function close(float|string $actualClosing, ?string $notes = null): void
    {
        $actual = (float) $actualClosing;
        $expected = (float) $this->expected_closing;
        $diff = $actual - $expected;

        $this->update([
            'actual_closing' => $actual,
            'difference' => $diff,
            'status' => 'closed',
            'closed_at' => now(),
            'notes' => $notes ?? $this->notes,
        ]);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function treasury(): BelongsTo
    {
        return $this->belongsTo(Treasury::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
