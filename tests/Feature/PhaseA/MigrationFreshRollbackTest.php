<?php

namespace Tests\Feature\PhaseA;

use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class MigrationFreshRollbackTest extends TestCase
{
    public function test_migrations_can_run_fresh_and_rollback_without_errors(): void
    {
        // 1. Run migrate:fresh
        $freshCode = Artisan::call('migrate:fresh');
        $this->assertEquals(0, $freshCode, 'migrate:fresh failed: ' . Artisan::output());

        // 2. Run migrate:rollback
        $rollbackCode = Artisan::call('migrate:rollback');
        $this->assertEquals(0, $rollbackCode, 'migrate:rollback failed: ' . Artisan::output());

        // 3. Re-run migrate so other tests or follow-ups have clean tables
        $reMigrateCode = Artisan::call('migrate');
        $this->assertEquals(0, $reMigrateCode, 'migrate re-run failed: ' . Artisan::output());
    }
}
