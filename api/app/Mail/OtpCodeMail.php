<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpCodeMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public readonly string $Code) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Sahana doğrulama kodun');
    }

    public function content(): Content
    {
        return new Content(htmlString: sprintf(
            '<p>Sahana doğrulama kodun: <strong>%s</strong></p><p>Kod 2 dakika geçerlidir. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.</p>',
            $this->Code,
        ));
    }
}
