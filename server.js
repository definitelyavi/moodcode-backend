require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-frontend-url.vercel.app' 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

const SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
const SOUNDCLOUD_CLIENT_SECRET = process.env.SOUNDCLOUD_CLIENT_SECRET;
const REDIRECT_URI = process.env.SOUNDCLOUD_REDIRECT_URI;
const SOUNDCLOUD_API_BASE = 'https://api.soundcloud.com';

const pkceStore = new Map();

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

function cleanupExpiredPkce() {
  const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);
  for (const [key, value] of pkceStore.entries()) {
    if (value.timestamp < fifteenMinutesAgo) {
      pkceStore.delete(key);
    }
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/auth/soundcloud/url', (req, res) => {
  try {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();
    
    pkceStore.set(state, {
      codeVerifier,
      codeChallenge,
      timestamp: Date.now()
    });
    
    cleanupExpiredPkce();
    
    const authUrl = `https://soundcloud.com/connect?` +
      `client_id=${SOUNDCLOUD_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=non-expiring&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256&` +
      `state=${state}`;
    
    res.json({ authUrl, state });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

app.post('/auth/soundcloud/token', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Authorization code and state are required' });
    }
    
    const pkceData = pkceStore.get(state);
    if (!pkceData) {
      return res.status(400).json({ 
        error: 'State parameter already used or expired'
      });
    }
    
    pkceStore.delete(state);
    
    const requestData = new URLSearchParams({
      client_id: SOUNDCLOUD_CLIENT_ID,
      client_secret: SOUNDCLOUD_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      code: code,
      code_verifier: pkceData.codeVerifier
    });
    
    const tokenResponse = await axios.post('https://secure.soundcloud.com/oauth/token', 
      requestData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json; charset=utf-8'
        },
        timeout: 15000
      }
    );
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    const userResponse = await axios.get(`${SOUNDCLOUD_API_BASE}/me`, {
      headers: { 'Authorization': `Bearer ${access_token}` },
      timeout: 10000
    });
    
    res.json({
      access_token,
      refresh_token,
      expires_in,
      user: userResponse.data
    });
    
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to exchange code for token';
    if (error.response?.data?.error === 'invalid_grant') {
      errorMessage = 'Authorization code expired. Please try again.';
    } else if (error.response?.data?.error === 'invalid_client') {
      errorMessage = 'Invalid client credentials.';
    }
    
    res.status(error.response?.status || 500).json({ 
      error: errorMessage,
      details: error.response?.data?.error_description || error.message
    });
  }
});

app.get('/api/soundcloud/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const userResponse = await axios.get(`${SOUNDCLOUD_API_BASE}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    res.json({ user: userResponse.data });
    
  } catch (error) {
    console.error('Get user error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

app.get('/api/soundcloud/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const response = await axios.get(`${SOUNDCLOUD_API_BASE}/tracks`, {
      params: { q, limit, streamable: true },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    res.json({ tracks: response.data });
    
  } catch (error) {
    console.error('Search error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

const MOOD_CONFIG = {
  frustrated: {
    genres: ['hip hop', 'rap', 'rock', 'metal'],
    energy: 'high',
    valence: 'negative'
  },
  excited: {
    genres: ['pop', 'electronic', 'dance', 'hip hop'],
    energy: 'high', 
    valence: 'positive'
  },
  satisfied: {
    genres: ['r&b', 'soul', 'indie', 'alternative'],
    energy: 'medium',
    valence: 'positive'
  },
  tired: {
    genres: ['indie', 'alternative', 'ambient', 'lo-fi'],
    energy: 'low',
    valence: 'neutral'
  },
  euphoric: {
    genres: ['pop', 'hip hop', 'funk', 'soul'],
    energy: 'very high',
    valence: 'very positive'
  }
};

const ARTISTS_BY_GENRE = {
  'hip hop': ['drake', 'kendrick lamar', 'j cole', 'travis scott'],
  'rap': ['eminem', 'kanye west', 'jay z', 'nas'],
  'pop': ['taylor swift', 'dua lipa', 'ariana grande', 'the weeknd'],
  'r&b': ['sza', 'frank ocean', 'the weeknd', 'bryson tiller'],
  'soul': ['alicia keys', 'john legend', 'anderson paak', 'h.e.r'],
  'electronic': ['calvin harris', 'deadmau5', 'skrillex'],
  'indie': ['mac miller', 'rex orange county', 'clairo'],
  'alternative': ['lana del rey', 'arctic monkeys', 'tame impala'],
  'ambient': ['bon iver', 'cigarettes after sex', 'beach house'],
  'lo-fi': ['joji', 'keshi', '88rising collective']
};

function generateSearchTerms(mood) {
  const config = MOOD_CONFIG[mood] || MOOD_CONFIG.satisfied;
  const searchTerms = [];
  
  config.genres.forEach(genre => {
    const artists = ARTISTS_BY_GENRE[genre] || [];
    searchTerms.push(`${genre} ${config.valence}`);
    searchTerms.push(`${genre} ${config.energy} energy`);
    
    artists.slice(0, 2).forEach(artist => {
      searchTerms.push(`${artist} ${genre}`);
    });
  });
  
  searchTerms.push(`${mood} coding music`);
  searchTerms.push(`${config.valence} ${config.energy} music`);
  
  const modifiers = ['trending', 'popular', 'latest', 'hits', 'best'];
  const randomModifier = modifiers[Date.now() % modifiers.length];
  searchTerms.push(`${randomModifier} ${config.genres[0]}`);
  
  return searchTerms
    .filter((term, index, self) => self.indexOf(term) === index)
    .sort(() => 0.5 - Math.random())
    .slice(0, 10);
}

async function searchTracksForMood(mood, token) {
  const searchTerms = generateSearchTerms(mood);
  const allTracks = [];
  
  for (const term of searchTerms) {
    try {
      const randomOffset = Math.floor(Math.random() * 50);
      
      const response = await axios.get(`${SOUNDCLOUD_API_BASE}/tracks`, {
        params: {
          q: term,
          limit: 4,
          offset: randomOffset,
          streamable: true,
          duration: { from: 90000 }
        },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const filteredTracks = response.data.filter(track => {
        const hasEngagement = track.playback_count > 1000 || track.likes_count > 50;
        const appropriateDuration = track.duration > 90000 && track.duration < 480000;
        return hasEngagement && appropriateDuration;
      });
      
      allTracks.push(...filteredTracks);
    } catch (error) {
      console.error(`Search error for ${term}:`, error.message);
    }
  }
  
  return allTracks;
}

function selectDiverseTracks(tracks, limit = 15) {
  const uniqueTracks = [];
  const seenTitles = new Set();
  const seenArtists = new Set();
  
  tracks.forEach(track => {
    const artistName = track.user?.username?.toLowerCase() || '';
    const trackTitle = track.title?.toLowerCase() || '';
    
    if (!seenArtists.has(artistName) && !seenTitles.has(trackTitle)) {
      uniqueTracks.push(track);
      seenArtists.add(artistName);
      seenTitles.add(trackTitle);
    }
  });
  
  if (uniqueTracks.length < limit) {
    tracks.forEach(track => {
      const trackTitle = track.title?.toLowerCase() || '';
      if (uniqueTracks.length < limit && !seenTitles.has(trackTitle)) {
        uniqueTracks.push(track);
        seenTitles.add(trackTitle);
      }
    });
  }
  
  return uniqueTracks
    .sort(() => 0.5 - Math.random())
    .slice(0, limit);
}

async function createPlaylistWithTracks(token, title, description, trackIds) {
  const playlistData = {
    playlist: {
      title,
      description,
      sharing: 'public',
      tracks: trackIds.map(id => ({ id: id.toString() }))
    }
  };
  
  try {
    const response = await axios.post(`${SOUNDCLOUD_API_BASE}/playlists`, 
      playlistData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Playlist creation failed:', error.response?.data);
    
    const formData = new URLSearchParams();
    formData.append('playlist[title]', title);
    formData.append('playlist[description]', description);
    formData.append('playlist[sharing]', 'public');
    
    const fallbackResponse = await axios.post(`${SOUNDCLOUD_API_BASE}/playlists`, 
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return fallbackResponse.data;
  }
}

app.post('/api/soundcloud/playlist', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { mood, analysisData } = req.body;
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    if (!mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }
    
    const allTracks = await searchTracksForMood(mood, token);
    
    if (allTracks.length === 0) {
      return res.status(404).json({ 
        error: 'No suitable tracks found for this mood' 
      });
    }
    
    const finalTracks = selectDiverseTracks(allTracks, 15);
    const trackIds = finalTracks.map(track => track.id);
    
    const playlistTitle = `${mood.charAt(0).toUpperCase() + mood.slice(1)} Coding • ${new Date().toLocaleDateString()}`;
    const playlistDescription = `🎵 Generated playlist for ${mood} mood based on coding patterns.\n\n📱 Created by MoodCode Analytics\n🎯 Mood: ${mood}\n📊 ${finalTracks.length} tracks curated`;
    
    const createdPlaylist = await createPlaylistWithTracks(
      token, 
      playlistTitle, 
      playlistDescription, 
      trackIds
    );
    
    const playlist = {
      ...createdPlaylist,
      tracks: finalTracks,
      mood,
      analysisData,
      generatedAt: new Date().toISOString()
    };
    
    res.json({ playlist });
    
  } catch (error) {
    console.error('Playlist creation error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to create playlist',
      details: error.response?.data?.errors || error.message
    });
  }
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🎵 MoodCode Backend running on port ${PORT}`);
  console.log(`🔑 SoundCloud Client ID: ${SOUNDCLOUD_CLIENT_ID ? 'Set' : 'Missing'}`);
  console.log(`🔐 SoundCloud Secret: ${SOUNDCLOUD_CLIENT_SECRET ? 'Set' : 'Missing'}`);
  console.log(`🔄 Redirect URI: ${REDIRECT_URI}`);
});