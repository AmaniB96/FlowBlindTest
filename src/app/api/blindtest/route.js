import { NextResponse } from 'next/server';

const GENRE_MAPPING = {
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
  'afrobeat': 'afrobeat' // Custom handling for Afrobeat
};

const DIFFICULTY_MAPPING = {
  easy: { limit: 50, offset: 0 }, // Popular songs
  medium: { limit: 30, offset: 50 }, // Less popular
  hard: { limit: 20, offset: 100 } // Obscure songs
};

// Afrobeat artists for different difficulty levels
const AFROBEAT_ARTISTS = {
  easy: ['burna boy', 'wizkid', 'davido', 'tiwa savage', 'ayra starr', 'asake', 'rema', 'fireboy'],
  medium: ['omah lay', 'joeboy', 'tems', 'oxlade', 'kizz daniel', 'mayorkun', 'zlatan', 'naira marley'],
  hard: ['blaqbonez', 'alpha p', 'bella shmurda', 'crayon', 'lojay', 'buju', 'magixx', 'boy spyce']
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty') || 'medium';
  const count = parseInt(searchParams.get('count')) || 10;

  try {
    let apiUrl;
    const difficultyConfig = DIFFICULTY_MAPPING[difficulty];
    
    if (category === 'afrobeat') {
      // Special handling for Afrobeat
      const artistsForDifficulty = AFROBEAT_ARTISTS[difficulty] || AFROBEAT_ARTISTS.medium;
      const randomArtists = artistsForDifficulty
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(count, artistsForDifficulty.length));
      
      // Fetch songs from multiple Afrobeat artists
      const artistPromises = randomArtists.map(async (artist) => {
        const response = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(artist)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          return data.data?.filter(song => song.preview && song.preview !== '') || [];
        }
        return [];
      });

      const artistResults = await Promise.all(artistPromises);
      const allSongs = artistResults.flat();
      
      // Shuffle and select the requested number of songs
      const shuffledSongs = allSongs
        .sort(() => Math.random() - 0.5)
        .slice(0, count)
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

      return NextResponse.json({ 
        songs: shuffledSongs,
        category,
        difficulty,
        total: shuffledSongs.length 
      });
      
    } else if (category && category !== 'mixed') {
      // Search by genre
      const genreId = GENRE_MAPPING[category];
      if (genreId) {
        apiUrl = `https://api.deezer.com/genre/${genreId}/artists?limit=${difficultyConfig.limit}&index=${difficultyConfig.offset}`;
      } else {
        apiUrl = `https://api.deezer.com/search?q=${encodeURIComponent(category)}&limit=${difficultyConfig.limit}&index=${difficultyConfig.offset}`;
      }
    } else {
      // Mixed category - search popular artists
      const popularQueries = ['drake', 'taylor swift', 'weeknd', 'billie eilish', 'post malone', 'ariana grande'];
      const randomQuery = popularQueries[Math.floor(Math.random() * popularQueries.length)];
      apiUrl = `https://api.deezer.com/search?q=${randomQuery}&limit=${difficultyConfig.limit}&index=${difficultyConfig.offset}`;
    }

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`);
    }

    const data = await response.json();
    let songs = [];

    if (data.data) {
      // Filter songs that have preview URLs
      songs = data.data
        .filter(item => item.preview && item.preview !== '')
        .slice(0, count)
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
    }

    // If we don't have enough songs, get more from a backup search
    if (songs.length < count) {
      const backupResponse = await fetch(`https://api.deezer.com/chart/0/tracks?limit=${count * 2}`);
      const backupData = await backupResponse.json();
      
      const backupSongs = backupData.data
        .filter(item => item.preview && item.preview !== '')
        .slice(0, count - songs.length)
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
      
      songs = [...songs, ...backupSongs];
    }

    // Shuffle the songs array
    for (let i = songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [songs[i], songs[j]] = [songs[j], songs[i]];
    }

    return NextResponse.json({ 
      songs: songs.slice(0, count),
      category,
      difficulty,
      total: songs.length 
    });

  } catch (error) {
    console.error('Blindtest API error:', error);
    return NextResponse.json(
      { error: `Failed to fetch songs: ${error.message}` }, 
      { status: 500 }
    );
  }
}