<?php

namespace App\Jobs;

use App\Support\ExpoPushClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendExpoPush implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  array<int, string>  $Tokens
     * @param  array<string, mixed>  $Data
     */
    public function __construct(
        private readonly array $Tokens,
        private readonly string $Title,
        private readonly string $Body,
        private readonly array $Data = [],
    ) {}

    public function handle(ExpoPushClient $Client): void
    {
        $Client->send($this->Tokens, $this->Title, $this->Body, $this->Data);
    }
}
