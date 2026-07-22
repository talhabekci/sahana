<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $Document['title'] }} — Sahana</title>
    <style>
        body {
            margin: 0;
            background: #0B1F14;
            color: #EAF2EA;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
        }
        .wrap {
            max-width: 640px;
            margin: 0 auto;
            padding: 48px 24px 80px;
        }
        a.back {
            color: #C9F24E;
            text-decoration: none;
            font-size: 14px;
        }
        h1 {
            font-size: 28px;
            margin: 24px 0 4px;
        }
        .updated {
            color: #7C947F;
            font-size: 13px;
            margin-bottom: 32px;
        }
        h2 {
            font-size: 17px;
            color: #C9F24E;
            margin-top: 32px;
            margin-bottom: 8px;
        }
        p {
            color: #D3E0D4;
            font-size: 15px;
            margin: 0 0 4px;
        }
    </style>
</head>
<body>
    <div class="wrap">
        <a class="back" href="{{ route('landing.tr') }}">‹ Sahana'ya dön</a>
        <h1>{{ $Document['title'] }}</h1>
        <div class="updated">Son güncelleme: {{ $Document['updated_at'] }}</div>
        @foreach ($Document['sections'] as $Section)
            @isset($Section['heading'])
                <h2>{{ $Section['heading'] }}</h2>
            @endisset
            <p>{{ $Section['body'] }}</p>
        @endforeach
    </div>
</body>
</html>
