<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 't1_licenses_users';

    protected $fillable = [
        'role_id',
        'full_name',
        'company_name',
        'email',
        'password_hash',
        'phone_number',
        'is_active',
    ];

    protected $hidden = [
        'password_hash',
    ];

    // Override the core password field mapping for Laravel Auth
    public function getAuthPassword()
    {
        return $this->password_hash;
    }
}
