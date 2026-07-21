<?php

use App\Models\WaitlistEntry;

it('adds a new email to the waitlist', function () {
    $response = $this->postJson('/waitlist', ['email' => 'oyuncu@example.com']);

    $response->assertStatus(201);

    expect(WaitlistEntry::where('email', 'oyuncu@example.com')->exists())->toBeTrue();
});

it('normalizes email casing/whitespace before storing', function () {
    $this->postJson('/waitlist', ['email' => '  Oyuncu@Example.com  ']);

    expect(WaitlistEntry::where('email', 'oyuncu@example.com')->exists())->toBeTrue();
});

it('is idempotent when the same email joins twice', function () {
    $this->postJson('/waitlist', ['email' => 'oyuncu@example.com']);
    $response = $this->postJson('/waitlist', ['email' => 'oyuncu@example.com']);

    $response->assertStatus(201);

    expect(WaitlistEntry::where('email', 'oyuncu@example.com')->count())->toBe(1);
});

it('rejects an invalid email', function () {
    $response = $this->postJson('/waitlist', ['email' => 'not-an-email']);

    $response->assertStatus(422);

    expect(WaitlistEntry::count())->toBe(0);
});

it('rate limits repeated waitlist submissions from the same IP', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/waitlist', ['email' => "player{$i}@example.com"]);
    }

    $response = $this->postJson('/waitlist', ['email' => 'oneMore@example.com']);

    $response->assertStatus(429);
});
