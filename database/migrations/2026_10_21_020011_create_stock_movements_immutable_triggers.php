<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared("
            CREATE TRIGGER trg_stock_movements_prevent_update
            BEFORE UPDATE ON stock_movements
            FOR EACH ROW
            BEGIN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'stock_movements is an immutable ledger and cannot be updated.';
            END
        ");

        DB::unprepared("
            CREATE TRIGGER trg_stock_movements_prevent_delete
            BEFORE DELETE ON stock_movements
            FOR EACH ROW
            BEGIN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'stock_movements is an immutable ledger and cannot be deleted.';
            END
        ");
    }

    public function down(): void
    {
        DB::unprepared("DROP TRIGGER IF EXISTS trg_stock_movements_prevent_update");
        DB::unprepared("DROP TRIGGER IF EXISTS trg_stock_movements_prevent_delete");
    }
};
