<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchasePayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id',
        'date',
        'amount',
        'payment_method_id',
        'treasury_id',
        'bank_account_id',
        'reference',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:4',
    ];

    protected static function booted(): void
    {
        static::deleted(function (PurchasePayment $payment) {
            if ($order = $payment->purchaseOrder) {
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

            ContactLedgerEntry::where('reference_type', 'PurchasePayment')
                ->where('reference_id', $payment->id)
                ->delete();
        });
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
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
