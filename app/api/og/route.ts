import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ title: "", image: "" });

  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return NextResponse.json({ title: "", image: "" });

    const html = await res.text();

    function extractMeta(...patterns: RegExp[]): string {
      for (const re of patterns) {
        const m = html.match(re);
        if (m?.[1]) return m[1].trim();
      }
      return "";
    }

    const title = extractMeta(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
      /<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i,
      /<title>([^<|]+)/i,
    );

    const image = extractMeta(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']thumbnail["'][^>]+content=["']([^"']+)["']/i,
    );

    return NextResponse.json({
      title: title.replace(/\s*[-|]\s*네이버 지도.*$/i, "").replace(/\s*[-|]\s*카카오맵.*$/i, "").trim(),
      image,
    });
  } catch (e) {
    console.error("[OG fetch error]", e);
    return NextResponse.json({ title: "", image: "" });
  }
}
