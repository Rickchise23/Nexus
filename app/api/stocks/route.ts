import { NextResponse } from 'next/server';

let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const key = process.env.STOCKS_API_KEY;
  const symbols = (process.env.STOCK_SYMBOLS || 'AAPL,TSLA').split(',');

  if (!key) {
    // Mock data when no API key
    return NextResponse.json([
      { symbol: "AAPL", price: 198.42, change: 4.52, changePercent: 2.3, updatedAt: new Date().toISOString() },
      { symbol: "TSLA", price: 342.18, change: -8.30, changePercent: -2.4, updatedAt: new Date().toISOString() },
      { symbol: "BTC", price: 97420, change: 1250, changePercent: 1.3, updatedAt: new Date().toISOString() },
    ]);
  }

  try {
    // Using Finnhub free API
    const quotes = await Promise.all(
      symbols.map(async (sym) => {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym.trim()}&token=${key}`);
        const d = await res.json();
        return {
          symbol: sym.trim(),
          price: d.c,
          change: d.d,
          changePercent: d.dp,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    cache = { data: quotes, ts: Date.now() };
    return NextResponse.json(quotes);
  } catch (e) {
    return NextResponse.json({ error: 'Stock fetch failed' }, { status: 500 });
  }
}
