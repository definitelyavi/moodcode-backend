# MoodCode Backend

Secure Node.js backend API powering MoodCode's intelligent playlist generation. Handles SoundCloud OAuth 2.0 authentication with PKCE and creates mood-based playlists using sophisticated music matching algorithms.

**[Frontend Application](https://moodcode-frontend.vercel.app)** | **[Frontend Repository](https://github.com/definitelyavi/moodcode-frontend)**

## Features

- **OAuth 2.0 with PKCE**: Secure SoundCloud authentication using Proof Key for Code Exchange
- **Intelligent Music Matching**: Advanced algorithms that map coding moods to appropriate music genres
- **Multi-Genre Search**: Diversified track discovery across hip-hop, electronic, indie, and ambient genres
- **Production Security**: CORS configuration, token validation, and secure credential management
- **RESTful API**: Clean endpoint design with comprehensive error handling

## Tech Stack

- **Runtime**: Node.js with Express.js
- **Authentication**: OAuth 2.0 PKCE flow implementation
- **APIs**: SoundCloud API v2 integration
- **Security**: Custom CORS, crypto-based PKCE, secure token handling
- **Deployment**: Railway with environment-based configuration

## Core Endpoints

```
GET  /auth/soundcloud/url     # Generate OAuth URL with PKCE
POST /auth/soundcloud/token   # Exchange code for access token
POST /api/soundcloud/playlist # Create mood-based playlist
GET  /api/soundcloud/search   # Search and filter tracks
GET  /health                  # Service status
```

## Music Algorithm

The system recognizes five distinct moods (Frustrated, Excited, Satisfied, Tired, Euphoric) and maps each to specific music characteristics including genre preferences, energy levels, and valence. The playlist generation algorithm searches multiple genres, filters by engagement metrics, and ensures artist diversity for balanced playlists.

## Architecture

Built with enterprise-grade security practices including temporary PKCE storage with automatic cleanup, comprehensive error handling with detailed responses, and production-ready CORS configuration supporting both development and deployment environments.

## Quick Start

```bash
git clone https://github.com/definitelyavi/moodcode-backend.git
cd moodcode-backend
npm install
npm start
```

Requires SoundCloud API credentials in environment variables. See `.env.example` for configuration.

## Author

**Avi** [@definitelyavi](https://github.com/definitelyavi)

---

*Secure backend infrastructure for intelligent music discovery*
