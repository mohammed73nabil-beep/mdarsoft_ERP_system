<?php

namespace App\Traits;

use App\Exceptions\ClosedFiscalYearException;
use App\Models\FiscalYear;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait ValidatesFiscalYear
{
    public static function bootValidatesFiscalYear(): void
    {
        static::creating(function ($model) {
            if (!empty($model->fiscal_year_id)) {
                $fiscalYear = FiscalYear::find($model->fiscal_year_id);
                if ($fiscalYear && $fiscalYear->isClosed()) {
                    throw new ClosedFiscalYearException('لا يمكن إنشاء مستند في سنة مالية مغلقة.');
                }
            }
        });
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }
}
