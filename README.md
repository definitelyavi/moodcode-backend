# MoodCode Backend

Secure Node.js backend API for MoodCode that handles SoundCloud OAuth 2.0 authentication with PKCE, processes mood analysis data from Git commits, and generates personalized playlists using sophisticated music matching algorithms.

## Overview

This backend service powers the MoodCode application by providing secure authentication flows, intelligent playlist generation, and seamless integration with the SoundCloud API. Built with enterprise-grade security practices and comprehensive error handling.

## Features

- **OAuth 2.0 with PKCE**: Secure SoundCloud authentication using Proof Key for Code Exchange
- **Intelligent Playlist Generation**: Advanced algorithms that match music to coding moods
- **Music Discovery Engine**: Multi-genre search with artist and mood-based filtering
- **Production Security**: CORS configuration, token validation, and secure credential handling
- **RESTful API Design**: Clean, documented endpoints with comprehensive error responses
- **Rate Limiting Protection**: Built-in safeguards against API abuse
- **Comprehensive Logging**: Detailed error tracking and request monitoring

## Live Application

**Frontend**: [https://moodcode-frontend.vercel.app](https://moodcode-frontend.vercel.app)  
**Frontend Repository**: [moodcode-frontend](https://github.com/definitelyavi/moodcode-frontend)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: OAuth 2.0 with PKCE flow
- **HTTP Client**: Axios
- **Security**: CORS, crypto module for PKCE implementation
- **APIs**: SoundCloud API v2
- **Deployment**: Railway/Heroku
- **Environment**: dotenv for configuration management

## API Endpoints

### Authentication
- `GET /auth/soundcloud/url` - Generate OAuth authorization URL with PKCE
- `POST /auth/soundcloud/token` - Exchange authorization code for access token

### SoundCloud Integration
- `GET /api/soundcloud/me` - Get authenticated user information
- `GET /api/soundcloud/search` - Search SoundCloud tracks with filters
- `POST /api/soundcloud/playlist` - Create mood-based playlist

### Health Check
- `GET /health` - Service health status

## Installation

### Prerequisites
- Node.js 16+ and npm
- SoundCloud API credentials (Client ID, Client Secret)
- Environment variables configured

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/definitelyavi/moodcode-backend.git
   cd moodcode-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file
   cp .env.example .env
   ```
   
   Add your configuration:
   ```env
   PORT=3001
   SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id
   SOUNDCLOUD_CLIENT_SECRET=your_soundcloud_client_secret
   SOUNDCLOUD_REDIRECT_URI=https://your-frontend-url.com/callback
   ```

4. **Start development server**
   ```bash
   npm start
   ```
   
## Mood Detection & Music Matching

### Supported Moods
The system recognizes five distinct coding moods:

- **Frustrated**: High-energy, intense music (Hip Hop, Rock, Metal)
- **Excited**: Upbeat, energetic tracks (Pop, Electronic, Dance)
- **Satisfied**: Balanced, positive vibes (R&B, Soul, Indie)
- **Tired**: Low-energy, ambient sounds (Indie, Alternative, Lo-fi)
- **Euphoric**: Maximum energy, uplifting music (Pop, Funk, Soul)

### Music Selection Algorithm

```javascript
// Example mood configuration
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
  }
  // ... additional moods
};
```

The algorithm:
1. **Generates diverse search terms** based on mood configuration
2. **Queries multiple genres** with randomized offsets for variety
3. **Filters tracks** by engagement metrics and duration
4. **Ensures diversity** by avoiding duplicate artists/titles
5. **Creates balanced playlists** with 15 curated tracks

## Security Implementation

### OAuth 2.0 with PKCE
```javascript
// PKCE implementation for enhanced security
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}
```

### CORS Configuration
- **Development**: `localhost:3000`, `localhost:3001`
- **Production**: Specific Vercel deployment URLs
- **Credentials**: Properly configured for cross-origin requests

### Token Management
- **Temporary storage** of PKCE verifiers with expiration
- **Automatic cleanup** of expired authentication data
- **Secure token exchange** with comprehensive error handling

## Error Handling

The API provides detailed error responses:

```javascript
// Example error response
{
  "error": "Authorization code expired. Please try again.",
  "details": "invalid_grant"
}
```

Common error scenarios:
- Invalid or expired authorization codes
- Missing required parameters
- SoundCloud API rate limiting
- Network connectivity issues

## Development

### Project Structure
```
├── server.js              # Main application entry point
├── package.json          # Dependencies and scripts
├── .env                  # Environment variables (not tracked)
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

### Key Dependencies
```json
{
  "express": "^4.18.0",
  "cors": "^2.8.5",
  "axios": "^1.6.0",
  "dotenv": "^16.0.0",
  "crypto": "Built-in Node.js module"
}
```

## Deployment

### Railway (Current)
The application is deployed on Railway with automatic deployments from the main branch.

### Environment Setup
1. Configure environment variables in Railway dashboard
2. Set up automatic deployments from GitHub
3. Monitor logs and performance metrics

### Health Monitoring
```bash
# Check service health
curl https://your-backend-url.com/health

# Expected response
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Testing

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test CORS configuration
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:3001/auth/soundcloud/url
```

### SoundCloud API Integration Testing
Use tools like Postman or curl to test:
- Authorization URL generation
- Token exchange flow
- Playlist creation with valid tokens

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Future Enhancements

- [ ] Redis integration for improved PKCE storage
- [ ] Rate limiting middleware implementation
- [ ] Webhook support for real-time playlist updates
- [ ] Advanced music recommendation algorithms
- [ ] Integration with additional music platforms
- [ ] Comprehensive test suite with Jest
- [ ] API documentation with Swagger/OpenAPI

## Known Issues

- SoundCloud API rate limiting during peak usage
- Playlist creation fallback to form-data when JSON fails
- PKCE storage cleanup runs on each auth request (consider scheduled cleanup)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Avi** (definitelyavi)
- GitHub: [@definitelyavi](https://github.com/definitelyavi)
- Frontend Repository: [moodcode-frontend](https://github.com/definitelyavi/moodcode-frontend)

## Acknowledgments

- [SoundCloud API](https://developers.soundcloud.com/) for music platform integration
- [Express.js](https://expressjs.com/) for the robust web framework
- [OAuth 2.0 PKCE](https://tools.ietf.org/html/rfc7636) specification for security guidance

---

*Secure backend infrastructure powering intelligent music discovery for developers*
