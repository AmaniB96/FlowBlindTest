import { NextResponse } from 'next/server';

// Standard Deezer Genre IDs
const DEEZER_GENRE_IDS = {
  'pop': '132',
  'rock': '152',
  'hip-hop': '116',
  'electronic': '106',
  'r&b': '165',
  'jazz': '129',
  'classical': '98',
  'country': '85',
  'reggae': '144',
  'alternative': '85',
};

// Map our custom genres to specific Deezer Playlist IDs for much greater variety
// UPDATED to use globally available playlists to avoid regional restrictions.
const CUSTOM_GENRE_PLAYLISTS = {
  'afrobeat': '1440614715',       // Afro Hits (already global)
  'french-rap': '13154564983',       // "Rap Francais" by Filtr France (more global rights)
  'uk-rap': '10601632322',       // "UK Rap" by Digster (more global rights)
  'k-pop': '4096400722',       // K-Pop Daebak (already global)
  'brazilian-funk': '1111142361', // Funk Hits (already global)
};

// The difficulty now determines which part of a playlist we sample from
const DIFFICULTY_MAPPING = {
  easy: { limit: 50, offset: 0 },   // Top 50 tracks
  medium: { limit: 100, offset: 50 }, // Tracks 50-150
  hard: { limit: 150, offset: 150 } // Tracks 150-300
};

// Helper function to fetch and process songs from a Deezer API URL
async function getSongsFromApi(url) {
  // Use Deezer's JSONP output to bypass CORS issues
  const jsonpUrl = `${url}${url.includes('?') ? '&' : '?'}output=jsonp&callback=dz`;
  
  try {
    const response = await fetch(jsonpUrl);
    if (!response.ok) {
      console.error(`Deezer API error for URL ${jsonpUrl}: ${response.status}`);
      return [];
    }
    
    let text = await response.text();
    
    // Robustly remove the JSONP callback wrapper 'dz(...)' to get the raw JSON
    const startIndex = text.indexOf('(');
    const endIndex = text.lastIndexOf(')');
    if (startIndex === -1 || endIndex === -1) {
        console.error("Invalid JSONP response:", text);
        return [];
    }
    text = text.substring(startIndex + 1, endIndex);

    const data = JSON.parse(text);
    
    // The track list is always in the 'data' property of the response object
    const tracks = data.data;

    if (!tracks || !Array.isArray(tracks)) {
      console.warn(`No 'data' array found in JSONP response for URL: ${jsonpUrl}`);
      return [];
    }

    return tracks
      // Filter out any tracks that don't have a preview URL
      .filter(song => song && song.preview && song.preview !== '' && song.readable)
      .map(song => ({
        id: song.id,
        title: song.title,
        artist: {
          id: song.artist.id,
          name: song.artist.name,
          picture: song.artist.picture_medium || song.artist.picture
        },
        album: {
          id: song.album.id,
          title: song.album.title,
          cover: song.album.cover_medium || song.album.cover
        },
        preview: song.preview,
        duration: song.duration
      }));
  } catch (error) {
    console.error(`Failed to fetch or process JSONP for URL ${jsonpUrl}:`, error);
    return [];
  }
}


export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty') || 'medium';
  const count = parseInt(searchParams.get('count')) || 10;

  try {
    let songs = [];
    const difficultyConfig = DIFFICULTY_MAPPING[difficulty];
    
    // Case 1: Custom genre using a specific playlist
    if (CUSTOM_GENRE_PLAYLISTS[category]) {
      const playlistId = CUSTOM_GENRE_PLAYLISTS[category];
      const apiUrl = `https://api.deezer.com/playlist/${playlistId}/tracks?limit=${difficultyConfig.limit}&index=${difficultyConfig.offset}`;
      songs = await getSongsFromApi(apiUrl);
    } 
    // Case 2: Standard Deezer genre
    else if (DEEZER_GENRE_IDS[category]) {
      const genreId = DEEZER_GENRE_IDS[category];
      const radioUrl = `https://api.deezer.com/genre/${genreId}/radios`;
      const radios = await getSongsFromApi(radioUrl); // This now correctly returns an array of radio objects
      if (radios && radios.length > 0) {
        const tracklistUrl = radios[0].tracklist;
        songs = await getSongsFromApi(`${tracklistUrl}?limit=${difficultyConfig.limit}&index=${difficultyConfig.offset}`);
      }
    }
    // Case 3: Mixed/Fallback category
    else {
      const apiUrl = `https://api.deezer.com/chart/0/tracks?limit=${difficultyConfig.limit}&index=${difficultyConfig.offset}`;
      songs = await getSongsFromApi(apiUrl);
    }

    // Shuffle the retrieved songs and slice to the final count
    const shuffledSongs = songs.sort(() => Math.random() - 0.5).slice(0, count);

    if (shuffledSongs.length < count && shuffledSongs.length === 0) {
        console.warn(`Could not fetch any valid songs for category: ${category}. This might be due to regional restrictions or lack of previews in the source playlist.`);
    }

    return NextResponse.json({ 
      songs: shuffledSongs,
      category,
      difficulty,
      total: shuffledSongs.length 
    });

  } catch (error) {
    console.error('Blindtest API error:', error);
    return NextResponse.json(
      { error: `Failed to fetch songs: ${error.message}` }, 
      { status: 500 }
    );
  }
}