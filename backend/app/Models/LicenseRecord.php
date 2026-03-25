<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LicenseRecord extends Model
{
    use HasFactory;

    protected $table = 't1_licenses_records';

    protected $fillable = [
        'user_id',
        'product_id',
        'payment_id',
        'license_key',
        'start_date',
        'end_date',
        'status',
        'max_devices'
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    // Relación inversa con el Cliente (User)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
