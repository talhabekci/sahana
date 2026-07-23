<?php

use App\Mail\OtpCodeMail;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

function requestOtpAndGetCode(string $Identifier): string
{
    Mail::fake();

    test()->postJson('/api/v1/auth/otp', ['identifier' => $Identifier])->assertOk();

    $Code = null;

    Mail::assertQueued(OtpCodeMail::class, function (OtpCodeMail $Mail) use (&$Code): bool {
        $Code = $Mail->Code;

        return true;
    });

    return (string) $Code;
}

function wrongCodeFor(string $Code): string
{
    return $Code === '000000' ? '000001' : '000000';
}

it('verifies the code and returns a token for a new user', function () {
    $Code = requestOtpAndGetCode('oyuncu@example.com');

    $Response = $this->postJson('/api/v1/auth/verify', [
        'identifier' => 'oyuncu@example.com',
        'code' => $Code,
    ]);

    $Response->assertOk()->assertJsonPath('data.is_new_user', true);

    expect($Response->json('data.token'))->toBeString()->not->toBeEmpty();
    $this->assertDatabaseHas('users', ['email' => 'oyuncu@example.com']);
});

it('returns is_new_user false for an existing user', function () {
    User::factory()->create(['email' => 'mevcut@example.com']);

    $Code = requestOtpAndGetCode('mevcut@example.com');

    $this->postJson('/api/v1/auth/verify', [
        'identifier' => 'mevcut@example.com',
        'code' => $Code,
    ])->assertOk()->assertJsonPath('data.is_new_user', false);
});

it('rejects a wrong code', function () {
    $Code = requestOtpAndGetCode('oyuncu@example.com');

    $this->postJson('/api/v1/auth/verify', [
        'identifier' => 'oyuncu@example.com',
        'code' => wrongCodeFor($Code),
    ])->assertStatus(422)->assertJsonPath('code', 'otp_invalid');
});

it('locks after five wrong attempts', function () {
    $Code = requestOtpAndGetCode('oyuncu@example.com');
    $WrongCode = wrongCodeFor($Code);

    foreach (range(1, 4) as $Attempt) {
        $this->postJson('/api/v1/auth/verify', [
            'identifier' => 'oyuncu@example.com',
            'code' => $WrongCode,
        ])->assertStatus(422)->assertJsonPath('code', 'otp_invalid');
    }

    $this->postJson('/api/v1/auth/verify', [
        'identifier' => 'oyuncu@example.com',
        'code' => $WrongCode,
    ])->assertStatus(429)->assertJsonPath('code', 'otp_locked');

    // Kilitten sonra doğru kod bile işe yaramaz — yeni kod istenmeli
    $this->postJson('/api/v1/auth/verify', [
        'identifier' => 'oyuncu@example.com',
        'code' => $Code,
    ])->assertStatus(422)->assertJsonPath('code', 'otp_expired');
});

it('rejects an expired code', function () {
    $Code = requestOtpAndGetCode('oyuncu@example.com');

    $this->travel(3)->minutes();

    $this->postJson('/api/v1/auth/verify', [
        'identifier' => 'oyuncu@example.com',
        'code' => $Code,
    ])->assertStatus(422)->assertJsonPath('code', 'otp_expired');
});

it('accepts the fixed reviewer demo code without a prior /otp call (BACKLOG store submission)', function () {
    config([
        'services.reviewer_demo.email' => 'reviewer@sahana-app.com',
        'services.reviewer_demo.otp_code' => '482913',
    ]);

    $Response = $this->postJson('/api/v1/auth/verify', [
        'identifier' => 'reviewer@sahana-app.com',
        'code' => '482913',
    ]);

    $Response->assertOk();
    expect($Response->json('data.token'))->toBeString()->not->toBeEmpty();
    $this->assertDatabaseHas('users', ['email' => 'reviewer@sahana-app.com']);
});

it('rejects a wrong code for the reviewer demo email', function () {
    config([
        'services.reviewer_demo.email' => 'reviewer@sahana-app.com',
        'services.reviewer_demo.otp_code' => '482913',
    ]);

    $this->postJson('/api/v1/auth/verify', [
        'identifier' => 'reviewer@sahana-app.com',
        'code' => '000000',
    ])->assertStatus(422)->assertJsonPath('code', 'otp_expired');
});

it('never times out for the reviewer demo email, unlike normal codes', function () {
    config([
        'services.reviewer_demo.email' => 'reviewer@sahana-app.com',
        'services.reviewer_demo.otp_code' => '482913',
    ]);

    $this->travel(1)->days();

    $this->postJson('/api/v1/auth/verify', [
        'identifier' => 'reviewer@sahana-app.com',
        'code' => '482913',
    ])->assertOk();
});

it('logs out and revokes the current token', function () {
    $Code = requestOtpAndGetCode('oyuncu@example.com');

    $Token = $this->postJson('/api/v1/auth/verify', [
        'identifier' => 'oyuncu@example.com',
        'code' => $Code,
    ])->json('data.token');

    $Headers = ['Authorization' => 'Bearer '.$Token];

    $this->postJson('/api/v1/auth/logout', [], $Headers)->assertOk();

    // Aynı test içindeki ikinci istekte guard'ın kullanıcıyı hatırlamaması için
    $this->app['auth']->forgetGuards();

    $this->getJson('/api/v1/me', $Headers)->assertStatus(401);
});
