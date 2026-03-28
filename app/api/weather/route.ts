import { NextResponse } from 'next/server';

// Cache weather for 10 minutes
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const key = process.env.WEATHER_API_KEY;
  const lat = process.env.WEATHER_LAT || '33.6846';
  const lon = process.env.WEATHER_LON || '-111.9613';

  if (!key) {
    // Return mock data when no API key configured
    return NextResponse.json({
      temp: 89, feelsLike: 91, condition: "Clear", icon: "☀️",
      high: 94, low: 72, humidity: 18, updatedAt: new Date().toISOString(),
    });
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${key}`
    );
    const d = await res.json();

    const iconMap: Record<string, string> = {
      '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️', '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️', '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️', '50d': '🌫️', '50n': '🌫️',
    };

    const weather = {
      temp: Math.round(d.main.temp),
      feelsLike: Math.round(d.main.feels_like),
      condition: d.weather[0].main,
      icon: iconMap[d.weather[0].icon] || '🌤️',
      high: Math.round(d.main.temp_max),
      low: Math.round(d.main.temp_min),
      humidity: d.main.humidity,
      updatedAt: new Date().toISOString(),
    };

    cache = { data: weather, ts: Date.now() };
    return NextResponse.json(weather);
  } catch (e) {
    return NextResponse.json({ error: 'Weather fetch failed' }, { status: 500 });
  }
}
