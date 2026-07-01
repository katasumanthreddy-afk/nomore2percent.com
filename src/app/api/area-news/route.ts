import { NextRequest, NextResponse } from 'next/server';

// GET /api/area-news?area=Kompally
// Fetches real, live news headlines related to infrastructure and project
// development for a given area, using NewsData.io's keyword search.
//
// IMPORTANT: this returns real news search results, not verified project
// status. A headline mentioning "Kompally metro" doesn't guarantee an
// official, confirmed project — it just means a news source used those
// words. The frontend must always label this clearly as "news search
// results", not "confirmed infrastructure data".
export async function GET(req: NextRequest) {
  try {
    const area = req.nextUrl.searchParams.get('area');
    if (!area) {
      return NextResponse.json({ success: false, message: 'area is required' }, { status: 400 });
    }

    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, message: 'News API not configured' }, { status: 500 });
    }

    // Search for area-specific infrastructure/development news.
    // NewsData.io's 'q' param does a full-text search across title+content.
    const query = `Hyderabad ${area} (metro OR road OR infrastructure OR development OR project)`;
    const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=${encodeURIComponent(query)}&country=in&language=en`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'success') {
      return NextResponse.json({
        success: false,
        message: data.results?.message || 'News API request failed. Check NEWSDATA_API_KEY is set correctly in Vercel.',
      }, { status: 502 });
    }

    const articles = (data.results || []).slice(0, 6).map((a: any) => ({
      title: a.title,
      link: a.link,
      source: a.source_id || a.source_name || 'Unknown source',
      publishedAt: a.pubDate,
      description: a.description,
      imageUrl: a.image_url,
    }));

    return NextResponse.json({ success: true, area, count: articles.length, articles });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
