<?php

namespace App\Services\Sms;

interface SmsSender
{
    public function send(string $Phone, string $Message): void;
}
