<?php

namespace App\Console\Commands;

use App\Models\City;
use App\Models\District;
use App\Models\SosyalhalisahaVenue;
use App\Support\SosyalhalisahaClient;
use Illuminate\Console\Command;

/**
 * İl/ilçe/saha dizinini sosyalhalisaha.com'un kendi arama uç noktasından
 * tek seferlik/nadiren elle içe aktarır (BACKLOG #58). Video içeriğine
 * dokunmaz, sadece isim/ID eşlemesi toplar — bkz. docs/features/05-videos.md
 * v1.5 ve docs/research/sosyalhalisaha.md §3.2.
 */
class SyncSosyalhalisahaVenues extends Command
{
    protected $signature = 'sosyalhalisaha:sync {--delay-ms=250 : Her istek arası bekleme (nazik davranmak için)}';

    protected $description = 'sosyalhalisaha.com\'un il/ilçe/saha dizinini tek seferlik içe aktarır (districts.external_id + sosyalhalisaha_venues)';

    public function handle(SosyalhalisahaClient $Client): int
    {
        $Client->bootstrap();
        $DelayMicroseconds = max(0, (int) $this->option('delay-ms')) * 1000;

        $MatchedDistricts = 0;
        $VenuesUpserted = 0;
        $SkippedCities = 0;

        $this->withProgressBar(City::all(), function (City $City) use ($Client, $DelayMicroseconds, &$MatchedDistricts, &$VenuesUpserted, &$SkippedCities): void {
            $AlreadyProcessed = District::where('city_id', $City->id)->whereNotNull('external_id')->exists();

            if ($AlreadyProcessed) {
                $SkippedCities++;

                return;
            }

            $Remote = $Client->getDistricts($City->id);
            usleep($DelayMicroseconds);

            $Local = District::where('city_id', $City->id)->get()->keyBy(
                fn (District $Local): string => self::normalize($Local->name),
            );

            foreach ($Remote as $Row) {
                /** @var District|null $District_ */
                $District_ = $Local->get(self::normalize($Row['name']));

                if ($District_ === null) {
                    continue;
                }

                $District_->forceFill(['external_id' => $Row['id']])->save();
                $MatchedDistricts++;

                $Places = $Client->getPlaces($Row['id']);
                usleep($DelayMicroseconds);

                foreach ($Places as $Place) {
                    SosyalhalisahaVenue::updateOrCreate(
                        ['district_id' => $District_->id, 'external_id' => $Place['id']],
                        ['name' => $Place['title']],
                    );
                    $VenuesUpserted++;
                }
            }
        });

        $this->newLine(2);
        $this->info("{$MatchedDistricts} ilçe eşleşti, {$VenuesUpserted} saha kaydedildi/güncellendi, {$SkippedCities} il daha önce işlendiği için atlandı.");

        return self::SUCCESS;
    }

    /** Türkçe İ/ı büyük/küçük harf farkını göz ardı eden karşılaştırma anahtarı. */
    private static function normalize(string $Value): string
    {
        return mb_strtoupper(str_replace(['ı', 'i'], ['I', 'İ'], $Value), 'UTF-8');
    }
}
