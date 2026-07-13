<?php

namespace Database\Factories;

use App\Models\Venue;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Venue>
 */
class VenueFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->streetName().' Halı Saha',
            'type' => 'internal',
            'lat' => 41.0 + fake()->randomFloat(4, -0.2, 0.2),
            'lng' => 29.0 + fake()->randomFloat(4, -0.2, 0.2),
            'address' => fake()->address(),
            'photos' => null,
            'price_min' => 100,
            'price_max' => 200,
            'amenities' => ['indoor' => true, 'capacity' => 14, 'shower' => true, 'parking' => false, 'cafeteria' => true],
            'status' => 'seeded',
        ];
    }

    /** BACKLOG #62: sosyalhalisaha.com eşleşmesi — lat/lng/yorum yok, sadece isim/ID. */
    public function sosyalhalisaha(int $DistrictId, int $ExternalId): static
    {
        return $this->state(fn (): array => [
            'type' => 'sosyalhalisaha',
            'district_id' => $DistrictId,
            'external_id' => $ExternalId,
            'lat' => null,
            'lng' => null,
            'address' => null,
            'photos' => null,
            'price_min' => null,
            'price_max' => null,
            'amenities' => null,
        ]);
    }
}
