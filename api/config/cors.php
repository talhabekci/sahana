<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | API-only, mobil istemci Sanctum bearer token kullanıyor (cookie/CSRF
    | akışı yok) — CORS burada tarayıcı tabanlı bir istemci (ör. ileride
    | eklenebilecek bir web paneli) için önemli. Varsayılan olarak hiçbir
    | origin'e izin verilmez; ihtiyaç olduğunda CORS_ALLOWED_ORIGINS'e
    | virgülle ayrılmış origin listesi eklenir (PRODUCTION-READINESS.md §D).
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
