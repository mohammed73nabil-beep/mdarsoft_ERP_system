<?php

namespace App\Services;

use App\Models\DocumentSequence;
use Illuminate\Support\Facades\DB;

class DocumentSequenceService
{
    /**
     * Generate the next document sequence number safely using lockForUpdate
     */
    public function getNextNumber(int $branchId, int $fiscalYearId, string $docType, ?string $defaultPrefix = null): string
    {
        return DB::transaction(function () use ($branchId, $fiscalYearId, $docType, $defaultPrefix) {
            $sequence = DocumentSequence::where('branch_id', $branchId)
                ->where('fiscal_year_id', $fiscalYearId)
                ->where('doc_type', $docType)
                ->lockForUpdate()
                ->first();

            if (!$sequence) {
                $prefix = $defaultPrefix ?? $this->getDefaultPrefix($docType);

                $sequence = DocumentSequence::create([
                    'branch_id' => $branchId,
                    'fiscal_year_id' => $fiscalYearId,
                    'doc_type' => $docType,
                    'prefix' => $prefix,
                    'last_number' => 0,
                    'padding' => 5,
                ]);

                // Re-fetch with lock to guarantee mutual exclusion
                $sequence = DocumentSequence::where('id', $sequence->id)
                    ->lockForUpdate()
                    ->first();
            }

            $sequence->last_number += 1;
            $sequence->save();

            return sprintf(
                '%s-%s',
                $sequence->prefix,
                str_pad((string) $sequence->last_number, $sequence->padding, '0', STR_PAD_LEFT)
            );
        });
    }

    /**
     * Get default prefix for a document type
     */
    public function getDefaultPrefix(string $docType): string
    {
        return match ($docType) {
            'sale_invoice' => 'INV',
            'sale_return' => 'SRT',
            'sale_draft' => 'DFT',
            'quotation' => 'QUO',
            'purchase' => 'PUR',
            'purchase_return' => 'PRT',
            'journal_entry' => 'JE',
            'voucher_payment' => 'PAY',
            'voucher_receipt' => 'REC',
            'check' => 'CHK',
            'bank_transfer' => 'TRF',
            'stock_adjustment' => 'ADJ',
            'transfer' => 'ITR',
            'pos_session' => 'POS',
            default => strtoupper(substr($docType, 0, 3)),
        };
    }
}
