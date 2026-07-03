<?php

namespace App\Exceptions;

use Exception;

/**
 * api-conventions.md §4: mobilin programatik davrandığı sabit `code` alanı
 * taşıyan hata (otp_expired, otp_locked, listing_already_filled...).
 */
class ApiError extends Exception
{
    public function __construct(
        string $Message,
        private readonly string $ApiCode,
        private readonly int $Status = 422,
    ) {
        parent::__construct($Message);
    }

    public function apiCode(): string
    {
        return $this->ApiCode;
    }

    public function status(): int
    {
        return $this->Status;
    }
}
