<!doctype html>
<html lang="{{ app()->getLocale() }}">
<head>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PGWQ6SR3');</script>
<!-- End Google Tag Manager -->
<meta charset="UTF-8" />
<meta name="csrf-token" content="{{ csrf_token() }}" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{{ __('landing.meta.title') }}</title>
<meta name="description" content="{{ __('landing.meta.description') }}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://sahana-app.com{{ app()->getLocale() === 'en' ? '/en' : '' }}" />
<link rel="alternate" hreflang="tr" href="https://sahana-app.com/" />
<link rel="alternate" hreflang="en" href="https://sahana-app.com/en" />
<link rel="alternate" hreflang="x-default" href="https://sahana-app.com/" />

<meta property="og:type" content="website" />
<meta property="og:url" content="https://sahana-app.com{{ app()->getLocale() === 'en' ? '/en' : '' }}" />
<meta property="og:site_name" content="Sahana" />
<meta property="og:locale" content="{{ app()->getLocale() === 'en' ? 'en_US' : 'tr_TR' }}" />
<meta property="og:title" content="{{ __('landing.meta.title') }}" />
<meta property="og:description" content="{{ __('landing.meta.og_description') }}" />
<meta property="og:image" content="https://sahana-app.com/images/{{ app()->getLocale() === 'en' ? 'og-cover-en.png' : 'og-cover.png' }}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="{{ __('landing.meta.og_image_alt') }}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{{ __('landing.meta.title') }}" />
<meta name="twitter:description" content="{{ __('landing.meta.og_description') }}" />
<meta name="twitter:image" content="https://sahana-app.com/images/{{ app()->getLocale() === 'en' ? 'og-cover-en.png' : 'og-cover.png' }}" />

<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="icon" type="image/png" href="data:image/png;base64,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" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Manrope:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

<script type="application/ld+json">
{
  "@@context": "https://schema.org",
  "@@type": "Organization",
  "name": "Sahana",
  "url": "https://sahana-app.com/",
  "logo": "https://sahana-app.com/images/icon-512.png",
  "description": "{{ __('landing.meta.og_description') }}"
}
</script>
<style>
  :root {
    --pitch-night: #0B1F14;
    --pitch-night-2: #081911;
    --turf: #12301F;
    --turf-raised: #1A4029;
    --line-faint: rgba(234,242,234,0.12);
    --line: rgba(234,242,234,0.30);
    --chalk: #EAF2EA;
    --moss: #8CA695;
    --lime: #C9F24E;
    --lime-ink: #0B1A0F;
    --clay: #E56A4D;

    --font-display: 'Barlow Condensed', 'Arial Narrow', sans-serif;
    --font-body: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-mono: 'Space Mono', 'SF Mono', Consolas, monospace;

    --container: 1160px;
    --radius-s: 10px;
    --radius-m: 16px;
    --radius-l: 26px;
  }

  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
  }

  body {
    margin: 0;
    background: var(--pitch-night);
    color: var(--chalk);
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  img { max-width: 100%; display: block; }
  a { color: inherit; }

  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
  }

  .skip-link {
    position: absolute; left: 12px; top: -60px; z-index: 100;
    background: var(--lime); color: var(--lime-ink); padding: 10px 16px;
    border-radius: var(--radius-s); font-family: var(--font-body); font-weight: 700;
    transition: top .2s ease;
  }
  .skip-link:focus { top: 12px; }

  :focus-visible { outline: 2px solid var(--lime); outline-offset: 3px; }

  .container { max-width: var(--container); margin: 0 auto; padding: 0 32px; }

  .eyebrow {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 0.78rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--lime);
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .eyebrow::before {
    content: '';
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--lime);
    box-shadow: 0 0 10px 2px rgba(201,242,78,0.7);
  }

  h1, h2, h3 {
    font-family: var(--font-display);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.01em;
    margin: 0;
    color: var(--chalk);
  }

  .lede {
    font-family: var(--font-body);
    color: var(--moss);
    font-size: clamp(1rem, 1.4vw, 1.15rem);
    max-width: 46ch;
  }

  .pitch-divider {
    position: relative;
    height: 1px;
    background: var(--line-faint);
    max-width: var(--container);
    margin: 0 auto;
  }
  .pitch-divider::after {
    content: '';
    position: absolute; left: 50%; top: 50%;
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--line);
    transform: translate(-50%, -50%);
  }

  .reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity .7s ease, transform .7s ease;
  }
  .reveal.in-view { opacity: 1; transform: translateY(0); }

  /* ===== Buttons & Form ===== */
  .btn {
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 0.95rem;
    border: 0;
    border-radius: var(--radius-s);
    padding: 14px 22px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    white-space: nowrap;
    transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
  }
  .btn-lime {
    background: var(--lime);
    color: var(--lime-ink);
    box-shadow: 0 0 0 0 rgba(201,242,78,0.5);
  }
  .btn-lime:hover { transform: translateY(-2px); box-shadow: 0 8px 24px -6px rgba(201,242,78,0.55); }
  .btn-ghost {
    background: transparent;
    color: var(--chalk);
    border: 1px solid var(--line);
  }
  .btn-ghost:hover { border-color: var(--lime); color: var(--lime); }

  .waitlist-form {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 28px;
  }
  .field {
    flex: 1 1 180px;
    background: var(--turf);
    border: 1px solid var(--line-faint);
    border-radius: var(--radius-s);
    padding: 15px 18px;
    color: var(--chalk);
    font-family: var(--font-body);
    font-size: 0.95rem;
  }
  .field::placeholder { color: var(--moss); }
  .field:focus { border-color: var(--lime); outline: none; }
  .waitlist-form select.field { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238CA695' stroke-width='1.6' fill='none'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 34px; }
  .waitlist-note { font-size: 0.8rem; color: var(--moss); margin-top: 12px; }
  .waitlist-error { display: none; font-size: 0.85rem; color: var(--clay); margin-top: 12px; }
  .waitlist-success {
    display: none;
    align-items: center;
    gap: 12px;
    background: var(--turf);
    border: 1px solid var(--lime);
    border-radius: var(--radius-s);
    padding: 16px 18px;
    margin-top: 22px;
    font-weight: 600;
  }
  .waitlist-success.show { display: flex; }
  .waitlist-success .check {
    flex: none;
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--lime); color: var(--lime-ink);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono); font-weight: 700; font-size: 0.85rem;
  }

  /* ===== Nav ===== */
  .nav {
    position: sticky; top: 0; z-index: 50;
    background: rgba(11,31,20,0.82);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line-faint);
  }
  .nav-inner {
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 32px;
  }
  .brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 800; font-size: 1.35rem; letter-spacing: -0.01em; text-decoration: none; }
  .brand img { width: 30px; height: 30px; }
  .nav-links { display: flex; gap: 40px; list-style: none; margin: 0; padding: 0; font-size: 0.92rem; font-weight: 600; }
  .nav-links a { text-decoration: none; color: var(--moss); transition: color .15s ease; }
  .nav-links a:hover { color: var(--chalk); }
  .nav-cta { display: flex; align-items: center; gap: 16px; }
  .lang-switch { font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; letter-spacing: 0.05em; color: var(--moss); text-decoration: none; border: 1px solid var(--line-faint); border-radius: 999px; padding: 6px 12px; transition: color .15s ease, border-color .15s ease; }
  .lang-switch:hover { color: var(--lime); border-color: rgba(201,242,78,0.4); }
  @media (max-width: 760px) {
    .nav-links { display: none; }
  }

  /* ===== Hero ===== */
  .hero {
    position: relative;
    overflow: hidden;
    padding: 132px 0 144px;
    background:
      radial-gradient(760px 420px at 14% -10%, rgba(201,242,78,0.14), transparent 60%),
      radial-gradient(620px 420px at 92% 8%, rgba(201,242,78,0.08), transparent 55%),
      repeating-linear-gradient(135deg, rgba(255,255,255,0.014) 0px, rgba(255,255,255,0.014) 46px, transparent 46px, transparent 92px),
      var(--pitch-night);
  }
  .hero-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 80px;
    align-items: center;
  }
  .hero h1 {
    font-size: clamp(2.6rem, 5.6vw, 4.6rem);
    margin: 26px 0 28px;
  }
  .hero h1 .accent { color: var(--lime); }
  @media (max-width: 900px) {
    .hero-grid { grid-template-columns: 1fr; }
  }

  .match-card {
    position: relative;
    background: var(--turf);
    border: 1px solid var(--line-faint);
    border-radius: var(--radius-l);
    padding: 30px 30px 32px;
    box-shadow: 0 30px 70px -30px rgba(0,0,0,0.65), 0 0 0 1px rgba(201,242,78,0.05);
    transform: rotate(-2.4deg);
    max-width: 380px;
    margin-left: auto;
  }
  @media (max-width: 900px) { .match-card { margin: 0 auto; transform: rotate(-1.4deg); } }
  .match-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
  .live-tag { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.1em; color: var(--lime); font-weight: 700; }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--lime); animation: pulse-dot 1.8s infinite ease-in-out; }
  @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
  .kickoff { font-family: var(--font-mono); font-size: 0.78rem; color: var(--moss); }
  .match-teams { display: flex; align-items: center; justify-content: space-between; font-family: var(--font-display); font-weight: 700; font-size: 1.4rem; margin-bottom: 10px; }
  .match-teams .vs { font-family: var(--font-mono); font-size: 0.7rem; color: var(--moss); font-weight: 400; }
  .match-venue { font-size: 0.85rem; color: var(--moss); margin-bottom: 24px; }
  .avatar-row { display: flex; align-items: center; margin-bottom: 18px; }
  .avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--turf-raised);
    border: 2px solid var(--turf);
    margin-left: -10px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono); font-size: 0.68rem; font-weight: 700; color: var(--chalk);
  }
  .avatar:first-child { margin-left: 0; }
  .avatar.overflow { background: var(--lime); color: var(--lime-ink); }
  .rsvp-label { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--moss); margin-bottom: 10px; }
  .rsvp-label strong { color: var(--chalk); font-family: var(--font-mono); }
  .progress-track { height: 6px; border-radius: 999px; background: var(--turf-raised); overflow: hidden; }
  .progress-fill { height: 100%; width: 0%; background: var(--lime); border-radius: 999px; transition: width 1.1s cubic-bezier(.2,.8,.2,1); }
  .progress-fill.filled { width: 86%; }

  /* ===== Section shell ===== */
  .section { padding: 132px 0; }
  .section-head { max-width: 620px; margin-bottom: 68px; }
  .section-head h2 { font-size: clamp(2rem, 3.6vw, 3rem); margin: 14px 0 16px; }

  /* ===== İlk Yarı — problem ===== */
  .problem-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 26px;
  }
  @media (max-width: 900px) { .problem-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .problem-grid { grid-template-columns: 1fr; } }
  .problem-card {
    background: var(--pitch-night-2);
    border: 1px dashed var(--line);
    border-radius: var(--radius-m);
    padding: 22px;
    font-size: 0.9rem;
    color: var(--moss);
  }
  .problem-card:nth-child(1) { transform: rotate(-1.6deg); }
  .problem-card:nth-child(2) { transform: rotate(1.1deg); }
  .problem-card:nth-child(3) { transform: rotate(-0.8deg); }
  .problem-card:nth-child(4) { transform: rotate(1.6deg); }
  .problem-card .tag {
    display: inline-block; font-family: var(--font-mono); font-size: 0.68rem;
    letter-spacing: 0.08em; text-transform: uppercase; color: var(--clay);
    border: 1px solid rgba(229,106,77,0.4); border-radius: 999px; padding: 4px 10px;
    margin-bottom: 14px;
  }
  .problem-card h3 { font-size: 1.15rem; font-weight: 700; color: var(--chalk); margin-bottom: 8px; }

  /* ===== İkinci Yarı — features ===== */
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 26px;
  }
  @media (max-width: 900px) { .feature-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 620px) { .feature-grid { grid-template-columns: 1fr; } }
  .feature-card {
    background: var(--turf);
    border: 1px solid var(--line-faint);
    border-radius: var(--radius-m);
    padding: 30px;
    transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
  }
  .feature-card:hover { transform: translateY(-4px); border-color: rgba(201,242,78,0.4); box-shadow: 0 20px 40px -24px rgba(0,0,0,0.6); }
  .feature-visual { height: 88px; margin-bottom: 18px; display: flex; align-items: center; }
  .feature-card h3 { font-size: 1.3rem; font-weight: 700; margin-bottom: 8px; }
  .feature-card p { font-size: 0.88rem; color: var(--moss); margin: 0; }

  /* mini visuals */
  .viz-pitch { position: relative; width: 100%; height: 100%; background: var(--turf-raised); border-radius: var(--radius-s); overflow: hidden; }
  .viz-pitch .dot { position: absolute; width: 9px; height: 9px; border-radius: 50%; background: var(--lime); box-shadow: 0 0 8px rgba(201,242,78,0.6); }

  .viz-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .viz-chip { font-family: var(--font-mono); font-size: 0.66rem; letter-spacing: 0.03em; padding: 7px 11px; border-radius: 999px; }
  .viz-chip.yes { background: var(--lime); color: var(--lime-ink); font-weight: 700; }
  .viz-chip.maybe { border: 1px solid var(--clay); color: var(--clay); }
  .viz-chip.no { border: 1px solid var(--line); color: var(--moss); }

  .viz-radar { position: relative; width: 88px; height: 88px; margin: 0 auto; }
  .viz-radar .ring { position: absolute; border-radius: 50%; border: 1px solid var(--line-faint); }
  .viz-radar .ring:nth-child(1) { inset: 0; }
  .viz-radar .ring:nth-child(2) { inset: 16px; }
  .viz-radar .ring:nth-child(3) { inset: 32px; }
  .viz-radar .pin { position: absolute; top: 14px; left: 22px; width: 10px; height: 10px; border-radius: 50%; background: var(--lime); box-shadow: 0 0 10px rgba(201,242,78,0.7); }

  .viz-bars { display: flex; align-items: flex-end; gap: 6px; height: 100%; }
  .viz-bars .bar { width: 12px; background: var(--turf-raised); border-radius: 3px 3px 0 0; }
  .viz-bars .bar.on { background: var(--lime); }
  .viz-bars .num { font-family: var(--font-mono); font-weight: 700; color: var(--chalk); margin-left: auto; align-self: center; }

  .viz-video { position: relative; width: 100%; height: 100%; border-radius: var(--radius-s); overflow: hidden; background: repeating-linear-gradient(120deg, var(--turf-raised) 0 14px, var(--pitch-night-2) 14px 28px); display: flex; align-items: center; justify-content: center; }
  .viz-video .play { width: 0; height: 0; border-style: solid; border-width: 11px 0 11px 18px; border-color: transparent transparent transparent var(--lime); filter: drop-shadow(0 0 8px rgba(201,242,78,0.6)); }

  .viz-chat { display: flex; flex-direction: column; gap: 8px; }
  .bubble { padding: 9px 13px; border-radius: 14px; font-size: 0.78rem; max-width: 82%; }
  .bubble.left { background: var(--turf-raised); color: var(--moss); border-bottom-left-radius: 4px; }
  .bubble.right { background: var(--lime); color: var(--lime-ink); align-self: flex-end; border-bottom-right-radius: 4px; font-weight: 600; }

  /* ===== Uzatmalar — data loop ===== */
  .loop-wrap { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 76px; align-items: center; }
  @media (max-width: 900px) { .loop-wrap { grid-template-columns: 1fr; } }
  .loop-diagram { position: relative; width: min(340px, 100%); aspect-ratio: 1 / 1; margin: 0 auto; }
  .loop-diagram svg { width: 100%; height: 100%; }
  .loop-ring { transform-origin: 50% 50%; animation: spin 40s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loop-node {
    position: absolute; transform: translate(-50%, -50%);
    text-align: center; width: 108px;
  }
  .loop-node .dot { width: 12px; height: 12px; border-radius: 50%; background: var(--lime); margin: 0 auto 8px; box-shadow: 0 0 12px rgba(201,242,78,0.7); }
  .loop-node span { font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.05em; text-transform: uppercase; color: var(--chalk); font-weight: 700; }
  .loop-node.n1 { left: 50%; top: 4%; }
  .loop-node.n2 { left: 96%; top: 50%; }
  .loop-node.n3 { left: 50%; top: 96%; }
  .loop-node.n4 { left: 4%; top: 50%; }
  .loop-center { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); font-family: var(--font-display); font-weight: 800; font-size: 1.1rem; color: var(--lime); text-align: center; }

  .loop-stats { display: flex; flex-direction: column; gap: 22px; margin-top: 30px; }
  .loop-stat { display: flex; align-items: baseline; gap: 16px; border-top: 1px solid var(--line-faint); padding-top: 18px; }
  .loop-stat .num { font-family: var(--font-mono); font-weight: 700; font-size: 1.5rem; color: var(--lime); flex: none; width: 108px; }
  .loop-stat p { margin: 0; color: var(--moss); font-size: 0.9rem; }

  .badge-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 40px; }
  .badge { display: flex; align-items: center; gap: 8px; background: var(--turf); border: 1px solid var(--line-faint); border-radius: 999px; padding: 8px 14px 8px 8px; font-size: 0.8rem; font-weight: 600; }
  .badge .ring { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--lime); flex: none; }

  /* ===== FAQ ===== */
  .faq-list { display: flex; flex-direction: column; gap: 0; max-width: 760px; }
  .faq-item { border-top: 1px solid var(--line-faint); padding: 22px 0; }
  .faq-item:last-child { border-bottom: 1px solid var(--line-faint); }
  .faq-item summary { cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between; font-family: var(--font-display); font-weight: 700; font-size: 1.15rem; }
  .faq-item summary::-webkit-details-marker { display: none; }
  .faq-item summary .plus { font-family: var(--font-mono); color: var(--lime); font-size: 1.2rem; transition: transform .2s ease; flex: none; margin-left: 16px; }
  .faq-item[open] summary .plus { transform: rotate(45deg); }
  .faq-item p { color: var(--moss); margin: 14px 0 0; max-width: 62ch; font-size: 0.92rem; }

  /* ===== Final CTA ===== */
  .final-cta {
    background:
      radial-gradient(700px 380px at 50% 0%, rgba(201,242,78,0.12), transparent 60%),
      repeating-linear-gradient(135deg, rgba(255,255,255,0.014) 0px, rgba(255,255,255,0.014) 46px, transparent 46px, transparent 92px),
      var(--pitch-night-2);
    text-align: center;
    padding: 148px 0;
  }
  .final-cta h2 { font-size: clamp(2.4rem, 5vw, 4rem); color: var(--lime); }
  .final-cta .lede { max-width: 46ch; margin: 18px auto 0; }
  .final-cta .waitlist-form { justify-content: center; max-width: 560px; margin: 26px auto 0; }
  .final-cta .waitlist-note, .final-cta .waitlist-success { max-width: 560px; margin-left: auto; margin-right: auto; }
  .final-cta .waitlist-success { justify-content: center; }

  /* ===== Footer ===== */
  footer { border-top: 1px solid var(--line-faint); padding: 84px 0 48px; }
  .footer-grid { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 40px; margin-bottom: 52px; }
  .footer-brand { max-width: 280px; }
  .footer-brand .brand { margin-bottom: 12px; }
  .footer-brand p { color: var(--moss); font-size: 0.88rem; }
  .footer-cols { display: flex; gap: 60px; flex-wrap: wrap; }
  .footer-col h4 { font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--moss); margin: 0 0 14px; }
  .footer-col ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  .footer-col a { text-decoration: none; color: var(--chalk); font-size: 0.9rem; }
  .footer-col a:hover { color: var(--lime); }
  .footer-bottom { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; color: var(--moss); font-size: 0.8rem; font-family: var(--font-mono); }
</style>
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PGWQ6SR3"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
<a class="skip-link" href="#main">İçeriğe geç</a>

<header class="nav">
  <div class="nav-inner">
    <a class="brand" href="#top">
      <img src="data:image/png;base64,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" alt="" width="30" height="30" />
      Sahana
    </a>
    <ul class="nav-links">
      <li><a href="#ozellikler">{{ __('landing.nav.features') }}</a></li>
      <li><a href="#nasil-calisir">{{ __('landing.nav.how') }}</a></li>
      <li><a href="#sss">{{ __('landing.nav.faq') }}</a></li>
    </ul>
    <div class="nav-cta">
      <a class="lang-switch" href="{{ __('landing.nav.lang_switch_url') }}">{{ __('landing.nav.lang_switch') }}</a>
      <a class="btn btn-lime" href="#katil">{{ __('landing.nav.cta') }}</a>
    </div>
  </div>
</header>

<main id="main">

  <!-- ===== Hero ===== -->
  <section class="hero" id="top">
    <div class="container hero-grid">
      <div>
        <span class="eyebrow">{{ __('landing.hero.eyebrow') }}</span>
        <h1>{{ __('landing.hero.title_pre') }}<span class="accent">{{ __('landing.hero.title_accent') }}</span>{{ __('landing.hero.title_post') }}</h1>
        <p class="lede">{{ __('landing.hero.lede') }}</p>

        <form class="waitlist-form" id="waitlist-hero" novalidate>
          <label class="sr-only" for="email-hero">{{ __('landing.hero.email_label') }}</label>
          <input class="field" type="email" id="email-hero" placeholder="{{ __('landing.hero.email_placeholder') }}" required />
          <button class="btn btn-lime" type="submit">{{ __('landing.hero.submit') }}</button>
        </form>
        <div class="waitlist-success" id="waitlist-hero-success">
          <span class="check">✓</span>
          <span>{{ __('landing.hero.success') }}</span>
        </div>
        <p class="waitlist-note">{{ __('landing.hero.note') }}</p>
      </div>

      <div class="match-card reveal" id="hero-card">
        <div class="match-card-top">
          <span class="live-tag"><span class="live-dot"></span>{{ __('landing.hero.card.live') }}</span>
          <span class="kickoff">{{ __('landing.hero.card.kickoff') }}</span>
        </div>
        <div class="match-teams">
          <span>{{ __('landing.hero.card.team_a') }}</span>
          <span class="vs">vs</span>
          <span>{{ __('landing.hero.card.team_b') }}</span>
        </div>
        <div class="match-venue">{{ __('landing.hero.card.venue') }}</div>
        <div class="avatar-row" aria-hidden="true">
          <div class="avatar">EB</div>
          <div class="avatar">CY</div>
          <div class="avatar">MK</div>
          <div class="avatar">TS</div>
          <div class="avatar">AK</div>
          <div class="avatar overflow">+7</div>
        </div>
        <div class="rsvp-label"><span>{{ __('landing.hero.card.participation_label') }}</span><strong>{{ __('landing.hero.card.participation_value') }}</strong></div>
        <div class="progress-track"><div class="progress-fill" id="hero-progress"></div></div>
      </div>
    </div>
  </section>

  <div class="pitch-divider"></div>

  <!-- ===== İlk Yarı — Problem ===== -->
  <section class="section" id="nasil-calisir">
    <div class="container">
      <div class="section-head reveal">
        <span class="eyebrow">{{ __('landing.problem.eyebrow') }}</span>
        <h2>{{ __('landing.problem.title') }}</h2>
        <p class="lede">{{ __('landing.problem.lede') }}</p>
      </div>
      <div class="problem-grid">
        @foreach (__('landing.problem.cards') as $Card)
        <div class="problem-card reveal">
          <span class="tag">{{ $Card['tag'] }}</span>
          <h3>{{ $Card['title'] }}</h3>
          <p>{{ $Card['body'] }}</p>
        </div>
        @endforeach
      </div>
    </div>
  </section>

  <div class="pitch-divider"></div>

  <!-- ===== İkinci Yarı — Features ===== -->
  <section class="section" id="ozellikler">
    <div class="container">
      <div class="section-head reveal">
        <span class="eyebrow">{{ __('landing.features.eyebrow') }}</span>
        <h2>{{ __('landing.features.title') }}</h2>
        <p class="lede">{{ __('landing.features.lede') }}</p>
      </div>

      <div class="feature-grid">
        <div class="feature-card reveal">
          <div class="feature-visual">
            <div class="viz-pitch" aria-hidden="true">
              <span class="dot" style="left:50%;top:14%"></span>
              <span class="dot" style="left:22%;top:46%"></span>
              <span class="dot" style="left:50%;top:46%"></span>
              <span class="dot" style="left:78%;top:46%"></span>
              <span class="dot" style="left:50%;top:80%"></span>
            </div>
          </div>
          <h3>{{ __('landing.features.lineup.title') }}</h3>
          <p>{{ __('landing.features.lineup.body') }}</p>
        </div>

        <div class="feature-card reveal">
          <div class="feature-visual">
            <div class="viz-chips" aria-hidden="true">
              <span class="viz-chip yes">{{ __('landing.features.rsvp.chip_yes') }}</span>
              <span class="viz-chip maybe">{{ __('landing.features.rsvp.chip_maybe') }}</span>
              <span class="viz-chip no">{{ __('landing.features.rsvp.chip_no') }}</span>
            </div>
          </div>
          <h3>{{ __('landing.features.rsvp.title') }}</h3>
          <p>{{ __('landing.features.rsvp.body') }}</p>
        </div>

        <div class="feature-card reveal">
          <div class="feature-visual">
            <div class="viz-radar" aria-hidden="true">
              <span class="ring"></span><span class="ring"></span><span class="ring"></span>
              <span class="pin"></span>
            </div>
          </div>
          <h3>{{ __('landing.features.listing.title') }}</h3>
          <p>{{ __('landing.features.listing.body') }}</p>
        </div>

        <div class="feature-card reveal">
          <div class="feature-visual">
            <div class="viz-bars" aria-hidden="true">
              <span class="bar" style="height:35%"></span>
              <span class="bar" style="height:55%"></span>
              <span class="bar on" style="height:70%"></span>
              <span class="bar on" style="height:85%"></span>
              <span class="bar on" style="height:100%"></span>
              <span class="num">8.4</span>
            </div>
          </div>
          <h3>{{ __('landing.features.stats.title') }}</h3>
          <p>{{ __('landing.features.stats.body') }}</p>
        </div>

        <div class="feature-card reveal">
          <div class="feature-visual">
            <div class="viz-video" aria-hidden="true"><span class="play"></span></div>
          </div>
          <h3>{{ __('landing.features.video.title') }}</h3>
          <p>{{ __('landing.features.video.body') }}</p>
        </div>

        <div class="feature-card reveal">
          <div class="feature-visual">
            <div class="viz-chat" aria-hidden="true">
              <span class="bubble left">{{ __('landing.features.chat.bubble_left') }}</span>
              <span class="bubble right">{{ __('landing.features.chat.bubble_right') }}</span>
            </div>
          </div>
          <h3>{{ __('landing.features.chat.title') }}</h3>
          <p>{{ __('landing.features.chat.body') }}</p>
        </div>
      </div>
    </div>
  </section>

  <div class="pitch-divider"></div>

  <!-- ===== Uzatmalar — Data loop ===== -->
  <section class="section">
    <div class="container">
      <div class="section-head reveal">
        <span class="eyebrow">{{ __('landing.loop.eyebrow') }}</span>
        <h2>{{ __('landing.loop.title') }}</h2>
        <p class="lede">{{ __('landing.loop.lede') }}</p>
      </div>

      <div class="loop-wrap">
        <div class="loop-diagram reveal" aria-hidden="true">
          <svg viewBox="0 0 340 340">
            <circle class="loop-ring" cx="170" cy="170" r="150" fill="none" stroke="rgba(234,242,234,0.18)" stroke-width="1.5" stroke-dasharray="4 10" stroke-linecap="round" />
          </svg>
          <div class="loop-node n1"><span class="dot"></span><span>{{ __('landing.loop.nodes.0') }}</span></div>
          <div class="loop-node n2"><span class="dot"></span><span>{{ __('landing.loop.nodes.1') }}</span></div>
          <div class="loop-node n3"><span class="dot"></span><span>{{ __('landing.loop.nodes.2') }}</span></div>
          <div class="loop-node n4"><span class="dot"></span><span>{{ __('landing.loop.nodes.3') }}</span></div>
          <div class="loop-center">{{ __('landing.loop.center') }}</div>
        </div>

        <div>
          <div class="loop-stats">
            @foreach (__('landing.loop.stats') as $Stat)
            <div class="loop-stat reveal">
              <span class="num">{{ $Stat['num'] }}</span>
              <p>{{ $Stat['body'] }}</p>
            </div>
            @endforeach
          </div>

          <div class="badge-row reveal" aria-hidden="true">
            @foreach (__('landing.loop.badges') as $Badge)
            <span class="badge"><span class="ring"></span>{{ $Badge }}</span>
            @endforeach
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="pitch-divider"></div>

  <!-- ===== FAQ ===== -->
  <section class="section" id="sss">
    <div class="container">
      <div class="section-head reveal">
        <span class="eyebrow">{{ __('landing.faq.eyebrow') }}</span>
        <h2>{{ __('landing.faq.title') }}</h2>
      </div>
      <div class="faq-list reveal">
        @foreach (__('landing.faq.items') as $Item)
        <details class="faq-item">
          <summary>{{ $Item['q'] }}<span class="plus">+</span></summary>
          <p>{{ $Item['a'] }}</p>
        </details>
        @endforeach
      </div>
    </div>
  </section>

  <!-- ===== Düdük — Final CTA ===== -->
  <section class="final-cta" id="katil">
    <div class="container">
      <span class="eyebrow" style="justify-content:center">{{ __('landing.cta.eyebrow') }}</span>
      <h2>{{ __('landing.cta.title') }}</h2>
      <p class="lede">{{ __('landing.cta.lede') }}</p>

      <form class="waitlist-form" id="waitlist-final" novalidate>
        <label class="sr-only" for="email-final">{{ __('landing.hero.email_label') }}</label>
        <input class="field" type="email" id="email-final" placeholder="{{ __('landing.hero.email_placeholder') }}" required />
        <button class="btn btn-lime" type="submit">{{ __('landing.hero.submit') }}</button>
      </form>
      <div class="waitlist-success" id="waitlist-final-success">
        <span class="check">✓</span>
        <span>{{ __('landing.hero.success') }}</span>
      </div>
      <p class="waitlist-note">{{ __('landing.cta.note') }}</p>
    </div>
  </section>

</main>

<footer>
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="#top">
          <img src="data:image/png;base64,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" alt="" width="30" height="30" />
          Sahana
        </a>
        <p>{{ __('landing.footer.tagline') }}</p>
      </div>
      <div class="footer-cols">
        <div class="footer-col">
          <h4>{{ __('landing.footer.col_product') }}</h4>
          <ul>
            <li><a href="#ozellikler">{{ __('landing.nav.features') }}</a></li>
            <li><a href="#nasil-calisir">{{ __('landing.nav.how') }}</a></li>
            <li><a href="#sss">{{ __('landing.nav.faq') }}</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>{{ __('landing.footer.col_legal') }}</h4>
          <ul>
            <li><a href="#">{{ __('landing.footer.legal_privacy') }}</a></li>
            <li><a href="#">{{ __('landing.footer.legal_kvkk') }}</a></li>
            <li><a href="#">{{ __('landing.footer.legal_terms') }}</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 SAHANA</span>
      <span>{{ __('landing.footer.bottom_tag') }}</span>
    </div>
  </div>
</footer>

<script>
  (function () {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scroll reveal
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('in-view'); });
    }

    // Hero RSVP progress bar fill on load
    var heroProgress = document.getElementById('hero-progress');
    window.requestAnimationFrame(function () {
      setTimeout(function () { heroProgress.classList.add('filled'); }, 400);
    });

    // Waitlist forms — POST /waitlist (see routes/web.php + WaitlistController)
    var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    var sendingLabel = @json(__('landing.hero.sending'));
    var errorMessage = @json(__('landing.hero.error'));

    function wireWaitlist(formId, successId) {
      var form = document.getElementById(formId);
      var success = document.getElementById(successId);
      if (!form) return;

      var errorEl = document.createElement('p');
      errorEl.className = 'waitlist-error';
      form.insertAdjacentElement('afterend', errorEl);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;

        var emailInput = form.querySelector('input[type="email"]');
        var button = form.querySelector('button[type="submit"]');
        var originalLabel = button.textContent;
        button.disabled = true;
        button.textContent = sendingLabel;
        errorEl.style.display = 'none';

        fetch('/waitlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken
          },
          body: JSON.stringify({ email: emailInput.value })
        })
          .then(function (res) {
            if (res.ok) {
              form.style.display = 'none';
              success.classList.add('show');
              return;
            }
            return res.json().then(function () {
              throw new Error('request_failed');
            });
          })
          .catch(function () {
            button.disabled = false;
            button.textContent = originalLabel;
            errorEl.textContent = errorMessage;
            errorEl.style.display = 'block';
          });
      });
    }
    wireWaitlist('waitlist-hero', 'waitlist-hero-success');
    wireWaitlist('waitlist-final', 'waitlist-final-success');
  })();
</script>

</body>
</html>
