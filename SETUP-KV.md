# Vercel KV Setup Guide

## Overview

This project now uses Vercel KV (Redis) to track real-time token usage data from users. The system implements a hybrid approach:

1. **Automatic tracking**: Every API call to `/api/groq` logs usage to KV
2. **Client sync**: Users' localStorage data is synced to KV every 30 seconds
3. **Admin dashboard**: Real-time view of all usage data with blocking capabilities

## Setup Steps

### 1. Add Redis Database to Your Project

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database**
3. Select **Redis** (from Marketplace)
4. Create the database (free tier available)
5. The `REDIS_URL` environment variable is automatically added

### 2. Environment Variables

The following environment variable is automatically set by Vercel when you create the Redis database:

- `REDIS_URL` - Redis connection string (automatically added)

**Additional required variable:**

- `ADMIN_KEY` - Your secret admin key for accessing the admin dashboard

**For local development:**
Run `vercel env pull .env.local` to pull environment variables, or manually add to `.env.local`:

```env
REDIS_URL=your_redis_connection_string
ADMIN_KEY=your_admin_key
```

### 3. Deploy to Vercel

After setting up KV and environment variables:

```bash
git push origin main
```

Vercel will automatically deploy and connect to your KV database.

## How It Works

### Data Collection

**Automatic (Server-side):**

- Every successful API call to `/api/groq` logs:
  - User token
  - IP address
  - Model used
  - Tokens consumed
  - Timestamp

**Client-side Sync:**

- Users' token usage from localStorage is synced every 30 seconds
- Also syncs after each token usage update (debounced 5 seconds)
- Syncs immediately on page load (after 2 seconds)

### Data Storage Structure

```
user:{userToken} -> {
  userToken: string,
  ipAddress: string | null,
  lastActive: number,
  modelUsage: {
    [model]: {
      tokensUsedDay: number,
      tokensRemainingDay: number,
      requestsDay: number
    }
  }
}

model:stats:{modelID} -> {
  totalTokensUsed: number,
  totalRequests: number,
  activeUsers: string[],
  lastUpdated: number
}

blocked:{userToken}:{modelID} -> true/false
```

### Admin Authentication

1. Admin visits `/admin`
2. Enters admin key
3. Key is validated via `/api/admin/login`
4. Session token stored in HTTP-only cookie (24 hour expiry)
5. All subsequent requests include cookie automatically
6. `/api/admin/auth` validates session on each request

### Admin Dashboard Features

- **Real-time statistics**: Per-model token usage aggregated across all users
- **User management**: View all active users with their usage per model
- **Blocking**: Block/unblock specific users from using specific models
- **Auto-refresh**: Data refreshes automatically

## API Endpoints

### `/api/tracking/sync` (POST)

- Receives localStorage usage data from clients
- Stores in KV with user token as key
- Updates model-level statistics

### `/api/admin/login` (POST)

- Validates admin key
- Creates session and sets HTTP-only cookie
- Returns success/failure

### `/api/admin/auth` (GET)

- Validates current session cookie
- Returns authentication status

### `/api/admin/usage` (GET)

- Returns all user usage data and model statistics
- Requires valid admin session

### `/api/admin/usage` (POST)

- Blocks/unblocks user from using a model
- Requires valid admin session

## Security Notes

- Admin key is never stored client-side (only in environment variable)
- Session tokens are HTTP-only cookies (not accessible via JavaScript)
- All admin endpoints validate session before processing
- User tokens are used as identifiers (consider hashing for privacy)

## Troubleshooting

### No data showing in admin dashboard

1. Check that Redis database is connected in Vercel dashboard
2. Verify `REDIS_URL` environment variable is set (run `vercel env pull .env.local` for local dev)
3. Check that users are making API calls (data is logged automatically)
4. Wait a few seconds for client sync to complete
5. Verify the database is accessible (check Vercel dashboard for connection status)
6. Check browser console and server logs for Redis connection errors

### Admin login not working

1. Verify `ADMIN_KEY` environment variable is set
2. Check browser console for errors
3. Ensure cookies are enabled in browser
4. Check that you're using HTTPS (required for secure cookies)

### Data not syncing

1. Check browser console for sync errors
2. Verify `/api/tracking/sync` endpoint is accessible
3. Check network tab for failed requests
4. Ensure user has made at least one API call

## Next Steps

- Consider adding data retention policies (currently 7 days for user data, 2 days for stats)
- Add rate limiting to sync endpoint
- Implement data export functionality
- Add user notification when blocked
- Consider anonymizing user tokens for privacy compliance
