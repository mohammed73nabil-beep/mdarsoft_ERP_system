<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class StockReconciliationService
{
    /**
     * Perform reconciliation check using MySQL <=> NULL-safe operator.
     * Compares stock_balances.quantity with SUM(CASE WHEN direction='in' THEN quantity ELSE -quantity END),
     * and for serial products compares stock_balances.quantity with count of in_stock product_serials.
     */
    public function reconcile(): array
    {
        // 1. Check stock_balances vs stock_movements sum using <=>
        $movementDiscrepancies = DB::select("
            SELECT
                sb.id AS balance_id,
                sb.product_id,
                sb.warehouse_id,
                sb.variation_id,
                sb.quantity AS stored_quantity,
                COALESCE(m.movement_qty, 0) AS movements_sum,
                p.name AS product_name,
                p.tracking_type
            FROM stock_balances sb
            INNER JOIN products p ON p.id = sb.product_id
            LEFT JOIN (
                SELECT
                    product_id,
                    warehouse_id,
                    variation_id,
                    SUM(CASE WHEN direction = 'in' THEN quantity ELSE -quantity END) AS movement_qty
                FROM stock_movements
                GROUP BY product_id, warehouse_id, variation_id
            ) m ON m.product_id = sb.product_id
               AND m.warehouse_id = sb.warehouse_id
               AND (m.variation_id <=> sb.variation_id)
            WHERE NOT (sb.quantity <=> COALESCE(m.movement_qty, 0))
        ");

        // 2. For serial products: check stock_balances vs count of in_stock serials using <=>
        $serialDiscrepancies = DB::select("
            SELECT
                sb.id AS balance_id,
                sb.product_id,
                sb.warehouse_id,
                sb.variation_id,
                sb.quantity AS stored_quantity,
                COALESCE(s.serial_count, 0) AS in_stock_serial_count,
                p.name AS product_name
            FROM stock_balances sb
            INNER JOIN products p ON p.id = sb.product_id
            LEFT JOIN (
                SELECT
                    product_id,
                    warehouse_id,
                    variation_id,
                    COUNT(*) AS serial_count
                FROM product_serials
                WHERE status = 'in_stock'
                GROUP BY product_id, warehouse_id, variation_id
            ) s ON s.product_id = sb.product_id
               AND s.warehouse_id = sb.warehouse_id
               AND (s.variation_id <=> sb.variation_id)
            WHERE p.tracking_type = 'serial'
              AND NOT (sb.quantity <=> COALESCE(s.serial_count, 0))
        ");

        // 3. Check orphan movements (movements without balance record)
        $orphanMovements = DB::select("
            SELECT
                m.product_id,
                m.warehouse_id,
                m.variation_id,
                SUM(CASE WHEN m.direction = 'in' THEN m.quantity ELSE -m.quantity END) AS movements_sum
            FROM stock_movements m
            LEFT JOIN stock_balances sb ON sb.product_id = m.product_id
               AND sb.warehouse_id = m.warehouse_id
               AND (sb.variation_id <=> m.variation_id)
            WHERE sb.id IS NULL
            GROUP BY m.product_id, m.warehouse_id, m.variation_id
            HAVING SUM(CASE WHEN m.direction = 'in' THEN m.quantity ELSE -m.quantity END) != 0
        ");

        $hasDiscrepancies = !empty($movementDiscrepancies) || !empty($serialDiscrepancies) || !empty($orphanMovements);

        return [
            'is_clean' => !$hasDiscrepancies,
            'has_discrepancies' => $hasDiscrepancies,
            'movement_discrepancies' => $movementDiscrepancies,
            'serial_discrepancies' => $serialDiscrepancies,
            'orphan_movements' => $orphanMovements,
        ];
    }
}
