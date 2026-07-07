<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  string  $Channel  Tam kanal adı (ör. "team.{public_id}",
     *                           "dm.{public_id}.{public_id}") — takım ve DM
     *                           sohbetleri aynı event'i paylaşır.
     * @param  array<string, mixed>  $Payload  MessageResource::shape() çıktısı
     */
    public function __construct(
        private readonly string $Channel,
        private readonly array $Payload,
    ) {}

    /** @return array<int, PrivateChannel> */
    public function broadcastOn(): array
    {
        return [new PrivateChannel($this->Channel)];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    /** @return array<string, mixed> */
    public function broadcastWith(): array
    {
        return $this->Payload;
    }
}
