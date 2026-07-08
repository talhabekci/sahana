<?php

use App\Models\User;
use App\Models\Venue;
use App\Models\VenueReview;

it('lists venues', function () {
    Venue::factory()->count(3)->create();
    $User = User::factory()->create();

    $this->actingAs($User)->getJson('/api/v1/venues')->assertOk()->assertJsonCount(3, 'data');
});

it('filters venues by name search', function () {
    Venue::factory()->create(['name' => 'Kadıköy Halı Saha']);
    Venue::factory()->create(['name' => 'Beşiktaş Spor Kompleksi']);
    $User = User::factory()->create();

    $Response = $this->actingAs($User)->getJson('/api/v1/venues?search=Kadıköy')->assertOk();

    $Response->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Kadıköy Halı Saha');
});

it('filters venues by near/radius and returns distance_km', function () {
    $Near = Venue::factory()->create(['lat' => 41.0, 'lng' => 29.0]);
    Venue::factory()->create(['lat' => 39.9, 'lng' => 32.8]); // Ankara, çok uzak
    $User = User::factory()->create();

    $Response = $this->actingAs($User)
        ->getJson('/api/v1/venues?near=41.001,29.001&radius=10')
        ->assertOk();

    $Response->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $Near->public_id)
        ->assertJsonPath('data.0.distance_km', fn ($Value) => $Value < 10);
});

it('shows venue detail with average score and recent reviews', function () {
    $Venue = Venue::factory()->create();
    VenueReview::factory()->create(['venue_id' => $Venue->id, 'score' => 4]);
    VenueReview::factory()->create(['venue_id' => $Venue->id, 'score' => 3]);
    $User = User::factory()->create();

    $Response = $this->actingAs($User)->getJson("/api/v1/venues/{$Venue->public_id}")->assertOk();

    $Response->assertJsonPath('data.reviews_count', 2)
        ->assertJsonPath('data.average_score', 3.5);

    expect($Response->json('data.reviews'))->toHaveCount(2);
});
