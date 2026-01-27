# Environment Variables Setup

This project uses centralized configuration for all API endpoints (REST API and WebSocket). **You only need to change the IP address in ONE place** - either in `app.json` or `.env` file.

## Quick Setup

### 🚀 Option 1: Auto-Detect IP (Easiest - Recommended!)

**The IP address is now automatically detected and updated!** Just run:

```bash
npm start
# or
npm run android
# or  
npm run ios
```

The script will automatically:
1. Detect your current machine's IP address
2. Update `app.json` with the correct IP
3. Start the Expo development server

You can also manually update the IP anytime by running:
```bash
npm run update-ip
```

### Option 2: Manual Setup via app.json

If you prefer to set it manually, edit `app.json` and update the `API_IP_ADDRESS` in the `extra` field:

```json
{
  "expo": {
    ...
    "extra": {
      "API_BASE_URL": "http://localhost:8080",
      "API_IP_ADDRESS": "192.168.10.249",
      "API_PORT": "8080",
      "API_PATH_PREFIX": "/api/v1"
    }
  }
}
```

**Note**: The auto-detect script (Option 1) handles this automatically, but you can still set it manually if needed.

**To find your IP address manually:**
- **Windows**: Run `ipconfig` in PowerShell/CMD and look for "IPv4 Address"
- **Mac/Linux**: Run `ifconfig` or `ip addr` in terminal

**Important**: After changing the IP in `app.json`, restart your Expo development server for changes to take effect.

### Option 2: Using .env file

1. **Create a `.env` file** in the root of `fyp-football-ui` directory
2. **Copy the following template** and update with your values:

```env
# API Configuration
# API Base URL (without /api/v1 suffix)
# For local development: http://localhost:8080 or http://192.168.x.x:8080
# For production: https://your-domain.com
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080

# API IP Address (for native mobile apps - Android/iOS)
EXPO_PUBLIC_API_IP_ADDRESS=192.168.10.249

# API Port
EXPO_PUBLIC_API_PORT=8080

# API Path Prefix (usually /api/v1)
EXPO_PUBLIC_API_PATH_PREFIX=/api/v1
```

**Note**: For `.env` files to work in Expo, you may need to install a package like `react-native-dotenv` or use Expo's built-in support (available in newer versions). The `app.json` method works immediately without any additional packages.

3. **Update the values** according to your environment:
   - **Local Development**: Use `http://localhost:8080` for web, and your local IP (e.g., `192.168.10.249`) for mobile
   - **Production**: Use your production domain (e.g., `https://api.yourdomain.com`)

## Summary

✅ **All API endpoints (REST and WebSocket) now use the centralized config**  
✅ **IP address auto-detected automatically** - just run `npm start`!  
✅ **Change IP address in ONE place** (`app.json` or `.env`)  
✅ **No more hardcoded IP addresses in the code**  
✅ **No manual IP updates needed** when switching WiFi or devices

## Important Notes

- The `.env` file is **not committed to git** (it's in `.gitignore`)
- For Expo projects, environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in client-side code
- After changing environment variables, you may need to restart the Expo development server
- The configuration is read from `config.ts` which you can modify if needed

## How It Works

- **Web Platform**: Uses `API_BASE_URL` (typically `http://localhost:8080`)
- **Mobile Platforms (iOS/Android)**: Uses `API_IP_ADDRESS` and `API_PORT` to build the URL
- **WebSocket Connections**: Automatically use the same configuration (no separate IP needed!)
- The API path prefix (`/api/v1`) is appended automatically
- All API calls and WebSocket connections are centralized through `config.ts`

## Troubleshooting

If the API connection isn't working:
1. Check that your `.env` file is in the root of `fyp-football-ui`
2. Verify the variable names start with `EXPO_PUBLIC_`
3. Restart your Expo development server after making changes
4. Check the console logs - the API base URL is logged on initialization

