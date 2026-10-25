<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add database-level triggers to enforce immutability on serial_events
        DB::unprepared("
            CREATE TRIGGER trg_serial_events_prevent_update
            BEFORE UPDATE ON serial_events
            FOR EACH ROW
            BEGIN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'serial_events is an immutable ledger and cannot be updated.';
            END
        ");

        DB::unprepared("
            CREATE TRIGGER trg_serial_events_prevent_delete
            BEFORE DELETE ON serial_events
            FOR EACH ROW
            BEGIN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'serial_events is an immutable ledger and cannot be deleted.';
            END
        ");
    }

    public function down(): void
    {
        DB::unprepared("DROP TRIGGER IF EXISTS trg_serial_events_prevent_update");
        DB::unprepared("DROP TRIGGER IF EXISTS trg_serial_events_prevent_delete");
    }
};
