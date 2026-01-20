# Environment Variables Setup

This project uses environment variables to configure the API endpoint. This allows you to easily change the API domain without modifying code.

## Quick Setup

### Option 1: Using app.json (Recommended - No additional setup needed)

The easiest way is to edit `app.json` and update the `extra` field with your API configuration:

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

**Note**: The current `app.json` already has these values set. Just update them to match your environment.

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

## Alternative: Using app.json

You can also configure the API in `app.json` by adding an `extra` field:

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

## Important Notes

- The `.env` file is **not committed to git** (it's in `.gitignore`)
- For Expo projects, environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in client-side code
- After changing environment variables, you may need to restart the Expo development server
- The configuration is read from `config.ts` which you can modify if needed

## How It Works

- **Web Platform**: Uses `EXPO_PUBLIC_API_BASE_URL` 
- **Mobile Platforms (iOS/Android)**: Uses `EXPO_PUBLIC_API_IP_ADDRESS` and `EXPO_PUBLIC_API_PORT`
- The API path prefix (`/api/v1`) is appended automatically

## Troubleshooting

If the API connection isn't working:
1. Check that your `.env` file is in the root of `fyp-football-ui`
2. Verify the variable names start with `EXPO_PUBLIC_`
3. Restart your Expo development server after making changes
4. Check the console logs - the API base URL is logged on initialization

