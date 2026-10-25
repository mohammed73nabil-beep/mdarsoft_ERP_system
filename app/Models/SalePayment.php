<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalePayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_order_id',
        'pos_session_id',
        'date',
        'amount',
        'payment_method_id',
        'treasury_id',
        'bank_account_id',
        'reference',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:4',
    ];

    protected static function booted(): void
    {
        static::deleted(function (SalePayment $payment) {
            if ($order = $payment->saleOrder) {
                $paid = (float) $order->payments()->sum('amount');
                $total = (float) $order->total_amount;
                $status = match (true) {
                    $paid <= 0     => 'unpaid',
                    $paid < $total => 'partial',
                    default        => 'paid',
                };
                $order->update([
                    'paid_amount'    => round($paid, 4),
                    'payment_status' => $status,
                ]);
            }

            ContactLedgerEntry::where('reference_type', 'SalePayment')
                ->where('reference_id', $payment->id)
                ->delete();
        });
    }

    public function saleOrder(): BelongsTo
    {
        return $this->belongsTo(SaleOrder::class);
    }

    public function posSession(): BelongsTo
    {
        return $this->belongsTo(PosSession::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function treasury(): BelongsTo
    {
        return $this->belongsTo(Treasury::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
