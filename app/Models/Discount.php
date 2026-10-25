<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Discount extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'value',
        'applies_to',
        'target_id',
        'start_date',
        'end_date',
        'min_amount',
        'is_active',
    ];

    protected $casts = [
        'value' => 'decimal:4',
        'min_amount' => 'decimal:4',
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
    ];
}
