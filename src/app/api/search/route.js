import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const deezerApiUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}`;

  try {
    const apiResponse = await fetch(deezerApiUrl, {
        headers: {
            'Accept': 'application/json',
        }
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return NextResponse.json({ error: `Deezer API error: ${errorText}` }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
