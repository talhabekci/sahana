<?php

use App\Mail\OtpCodeMail;
use Illuminate\Support\Facades\Mail;

it('sends an otp mail for a valid email identifier', function () {
    Mail::fake();

    $this->postJson('/api/v1/auth/otp', ['identifier' => 'oyuncu@example.com'])
        ->assertOk()
        ->assertJsonPath('data.status', 'sent');

    Mail::assertQueued(OtpCodeMail::class);
});

it('rejects a phone identifier (BACKLOG #61 — SMS sağlayıcısı entegre değil)', function () {
    $this->postJson('/api/v1/auth/otp', ['identifier' => '+905321234567'])
        ->assertStatus(422)
        ->assertJsonPath('code', 'validation_failed');
});

it('rejects an invalid identifier', function () {
    $this->postJson('/api/v1/auth/otp', ['identifier' => 'gecersiz-deger'])
        ->assertStatus(422)
        ->assertJsonPath('code', 'validation_failed');
});

it('rate limits after three requests for the same identifier', function () {
    Mail::fake();

    foreach (range(1, 3) as $Attempt) {
        $this->postJson('/api/v1/auth/otp', ['identifier' => 'oyuncu@example.com'])->assertOk();
    }

    $this->postJson('/api/v1/auth/otp', ['identifier' => 'oyuncu@example.com'])
        ->assertStatus(429)
        ->assertJsonPath('code', 'otp_rate_limited');
});

it('does not send a mail for the configured reviewer demo email (BACKLOG store submission)', function () {
    config(['services.reviewer_demo.email' => 'reviewer@sahana-app.com']);
    Mail::fake();

    $this->postJson('/api/v1/auth/otp', ['identifier' => 'reviewer@sahana-app.com'])
        ->assertOk()
        ->assertJsonPath('data.status', 'sent');

    Mail::assertNothingQueued();
});
