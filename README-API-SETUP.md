# API Setup Guide

## Secure Backend Implementation

The Groq API is now called through a secure serverless function. The API key is stored server-side only and never exposed to the browser.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
bun install
```

This will install `@vercel/node` for TypeScript types (optional but recommended).

### 2. Environment Variables

#### For Local Development (Vercel CLI)

1. Install Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:

   ```bash
   vercel login
   ```

3. Link your project:

   ```bash
   vercel link
   ```

4. Set environment variable:

   ```bash
   vercel env add GROQ_API_KEY
   ```

   Enter your Groq API key when prompted.

5. Run dev server:
   ```bash
   vercel dev
   ```

#### For Production (Vercel Dashboard)

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add `GROQ_API_KEY` with your Groq API key
4. Deploy your project

### 3. Project Structure

```
your-project/
├── api/
│   └── groq.ts          # Serverless function (backend)
├── src/
│   └── lib/
│       └── services/
│           └── groq.ts  # Frontend client (calls /api/groq)
└── vercel.json          # Vercel configuration
```

### 4. How It Works

1. **Frontend** (`src/lib/services/groq.ts`):
   - Calls `/api/groq` endpoint
   - Sends prompt and parameters
   - Receives response securely

2. **Backend** (`api/groq.ts`):
   - Runs on Vercel servers (not in browser)
   - Has access to `GROQ_API_KEY` from environment
   - Calls Groq API securely
   - Returns response to frontend

### 5. Security Features

✅ **API key never exposed** - Stays on server only  
✅ **Input validation** - Validates all requests  
✅ **Rate limiting** - Handles rate limit errors  
✅ **Error handling** - Secure error messages  
✅ **CORS support** - Proper CORS headers  
✅ **Type safety** - Full TypeScript support

### 6. Testing Locally

1. Start Vercel dev server:

   ```bash
   vercel dev
   ```

2. Your app will be available at `http://localhost:3000`
3. API endpoint will be at `http://localhost:3000/api/groq`

### 7. Deployment

1. Push to GitHub
2. Connect to Vercel
3. Vercel automatically:
   - Detects React app
   - Detects `api/` folder as serverless functions
   - Deploys both together

### 8. Troubleshooting

**Error: "GROQ_API_KEY is not set"**

- Make sure you've added the environment variable in Vercel dashboard
- For local dev, use `vercel env add GROQ_API_KEY`

**Error: "Cannot find module '@vercel/node'"**

- Install: `npm install -D @vercel/node`
- Or use the built-in types (already included in code)

**CORS errors**

- CORS is handled automatically by the serverless function
- No additional configuration needed

## Security Notes

⚠️ **Never commit API keys to git**  
⚠️ **Always use environment variables**  
⚠️ **API key is server-side only**  
✅ **Frontend never sees the API key**
