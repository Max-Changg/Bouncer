# Security Guide for Bouncer App

## API Key Security

### Current API Keys

This application uses the following API keys that are exposed to the frontend:

1. **Supabase Anon Key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - ✅ **Safe to expose** - This is designed to be public
   - Only allows operations permitted by Row Level Security (RLS) policies
   - Cannot access sensitive data without proper authentication

2. **Google Maps API Key** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
   - ⚠️ **Requires proper configuration** - Can be exposed but must be restricted

### Google Maps API Key Security

To secure your Google Maps API key:

1. **Go to Google Cloud Console**
   - Navigate to APIs & Services > Credentials
   - Find your API key and click "Edit"

2. **Restrict the API Key:**
   - **Application restrictions**: Choose "HTTP referrers (web sites)"
   - Add your domain(s): `yourdomain.com/*` or `localhost:3000/*` for development
   - **API restrictions**: Select only the APIs you need:
     - Places API
     - Maps JavaScript API

3. **Set Usage Quotas:**
   - Go to APIs & Services > Quotas
   - Set reasonable daily limits to prevent abuse

### Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps (requires restrictions)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Best Practices

1. **Never commit API keys to version control**
   - Add `.env.local` to your `.gitignore`
   - Use environment variables in production

2. **Monitor API usage**
   - Check Google Cloud Console regularly for unusual activity
   - Set up billing alerts

3. **Consider backend proxy for sensitive operations**
   - For operations requiring higher security, consider using Next.js API routes
   - This would require moving sensitive API calls to server-side

### Production Deployment

When deploying to production:

1. Set environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Ensure your Google Maps API key is restricted to your production domain
3. Monitor usage and costs

### Alternative Approaches

If you need higher security:

1. **Use Next.js API Routes** for sensitive operations
2. **Implement rate limiting** on your API routes
3. **Use server-side authentication** for critical operations

## Current Security Status

✅ **Supabase**: Properly configured with RLS
⚠️ **Google Maps**: Requires domain restrictions
✅ **Authentication**: Handled by Supabase Auth
✅ **Database**: Protected by Row Level Security
