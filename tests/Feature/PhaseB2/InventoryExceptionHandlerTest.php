<?php

namespace Tests\Feature\PhaseB2;

use App\Exceptions\InsufficientStockException;
use App\Exceptions\InvalidSerialStatusException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class InventoryExceptionHandlerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::get('/_test/insufficient-stock', function () {
            throw new InsufficientStockException();
        });

        Route::get('/_test/invalid-serial-status', function () {
            throw new InvalidSerialStatusException();
        });
    }

    public function test_insufficient_stock_exception_handling_for_inertia_and_json(): void
    {
        // 1. Inertia request: redirects back with errors in session containing Arabic message
        $inertiaResponse = $this->from('/inventory/vouchers/delivery/create')
            ->get('/_test/insufficient-stock', [
                'X-Inertia' => 'true',
            ]);

        $inertiaResponse->assertRedirect('/inventory/vouchers/delivery/create');
        $inertiaResponse->assertSessionHasErrors([
            'stock' => 'المخزون غير كافٍ لإتمام هذه العملية.',
        ]);

        // 2. JSON request: returns 422 with JSON errors
        $jsonResponse = $this->getJson('/_test/insufficient-stock');
        $jsonResponse->assertStatus(422);
        $jsonResponse->assertJson([
            'errors' => [
                'stock' => ['المخزون غير كافٍ لإتمام هذه العملية.'],
            ],
        ]);
    }

    public function test_invalid_serial_status_exception_handling_for_inertia_and_json(): void
    {
        // 1. Inertia request: redirects back with errors in session containing Arabic message
        $inertiaResponse = $this->from('/inventory/vouchers/delivery/create')
            ->get('/_test/invalid-serial-status', [
                'X-Inertia' => 'true',
            ]);

        $inertiaResponse->assertRedirect('/inventory/vouchers/delivery/create');
        $inertiaResponse->assertSessionHasErrors([
            'serials' => 'حالة الرقم التسلسلي (السيريال) غير صالحة لهذه العملية.',
        ]);

        // 2. JSON request: returns 422 with JSON errors
        $jsonResponse = $this->getJson('/_test/invalid-serial-status');
        $jsonResponse->assertStatus(422);
        $jsonResponse->assertJson([
            'errors' => [
                'serials' => ['حالة الرقم التسلسلي (السيريال) غير صالحة لهذه العملية.'],
            ],
        ]);
    }
}
