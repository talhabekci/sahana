<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sahana'ya katıl</title>
    <meta name="robots" content="noindex">
    <style>
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0B1F14;
            color: #EAF2EA;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            text-align: center;
            padding: 24px;
        }
        .card {
            max-width: 420px;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 8px;
        }
        p {
            color: #A9C2AD;
            font-size: 15px;
            line-height: 1.5;
        }
        .buttons {
            margin-top: 28px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .buttons a {
            display: block;
            padding: 14px 20px;
            border-radius: 999px;
            background: #C9F24E;
            color: #0B1A0F;
            text-decoration: none;
            font-weight: 600;
        }
        .buttons a.secondary {
            background: transparent;
            border: 1px solid #2E4A34;
            color: #EAF2EA;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>{{ $team !== null ? $team->name.' takımına davet edildin' : 'Sahana\'ya davet edildin' }}</h1>
        <p>Devam etmek için Sahana uygulamasını indir. Uygulama zaten yüklüyse bu link doğrudan açılır.</p>
        <div class="buttons">
            {{-- TODO: Gerçek App Store/Play Store linkleri yayınlanınca güncellenmeli. --}}
            <a href="https://apps.apple.com/app/idXXXXXXXXXX">App Store'da aç</a>
            <a class="secondary" href="https://play.google.com/store/apps/details?id=com.sahanaapp.app">Google Play'de aç</a>
        </div>
    </div>
</body>
</html>
