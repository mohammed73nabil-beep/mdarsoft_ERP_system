<?php

namespace App\Console\Commands;

use App\Services\StockReconciliationService;
use Illuminate\Console\Command;

class CheckStockReconciliationCommand extends Command
{
    protected $signature = 'stock:reconcile';

    protected $description = 'Verify reconciliation between stock_balances, stock_movements, and in_stock product_serials using MySQL <=> operator';

    public function handle(StockReconciliationService $service): int
    {
        $this->info('Starting stock reconciliation check...');

        $result = $service->reconcile();

        if ($result['is_clean']) {
            $this->info('✓ All stock balances reconcile perfectly with movements and serials.');
            return Command::SUCCESS;
        }

        $this->error('✗ Discrepancies detected!');

        if (!empty($result['movement_discrepancies'])) {
            $this->warn('--- Movement Discrepancies (Balance != SUM(Movements)) ---');
            $rows = array_map(function ($d) {
                return [
                    'Balance ID' => $d->balance_id,
                    'Product' => "{$d->product_name} (#{$d->product_id})",
                    'Warehouse ID' => $d->warehouse_id,
                    'Variation ID' => $d->variation_id ?? 'NULL',
                    'Balance' => $d->stored_quantity,
                    'Movements Sum' => $d->movements_sum,
                ];
            }, $result['movement_discrepancies']);
            $this->table(['Balance ID', 'Product', 'Warehouse ID', 'Variation ID', 'Balance', 'Movements Sum'], $rows);
        }

        if (!empty($result['serial_discrepancies'])) {
            $this->warn('--- Serial Discrepancies (Balance != Count(In-Stock Serials)) ---');
            $rows = array_map(function ($d) {
                return [
                    'Balance ID' => $d->balance_id,
                    'Product' => "{$d->product_name} (#{$d->product_id})",
                    'Warehouse ID' => $d->warehouse_id,
                    'Variation ID' => $d->variation_id ?? 'NULL',
                    'Balance' => $d->stored_quantity,
                    'In-Stock Serials' => $d->in_stock_serial_count,
                ];
            }, $result['serial_discrepancies']);
            $this->table(['Balance ID', 'Product', 'Warehouse ID', 'Variation ID', 'Balance', 'In-Stock Serials'], $rows);
        }

        if (!empty($result['orphan_movements'])) {
            $this->warn('--- Orphan Movements (No Balance Record) ---');
            $rows = array_map(function ($d) {
                return [
                    'Product ID' => $d->product_id,
                    'Warehouse ID' => $d->warehouse_id,
                    'Variation ID' => $d->variation_id ?? 'NULL',
                    'Movements Sum' => $d->movements_sum,
                ];
            }, $result['orphan_movements']);
            $this->table(['Product ID', 'Warehouse ID', 'Variation ID', 'Movements Sum'], $rows);
        }

        return Command::FAILURE;
    }
}
