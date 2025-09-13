# Bouncer App - Local Development Setup Guide

## Prerequisites

1. **Node.js** (v18 or later)
2. **npm** or **yarn**
3. **Supabase account** (for database and authentication)
4. **Google Cloud Console account** (for OAuth and Gmail integration)

## Environment Setup

### Step 1: Create Environment Files

You need to create environment files for different environments. Since these files are gitignored for security, you'll need to create them manually:

#### For Local Development
Create a file named `.env.local` in the `bouncer_app` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Gmail API Configuration (if using Gmail integration)
GMAIL_CLIENT_ID=your_gmail_client_id_here
GMAIL_CLIENT_SECRET=your_gmail_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Database Configuration (if using direct database access)
DATABASE_URL=your_database_url_here

# Environment
NODE_ENV=development
```

#### For Production
Create a file named `.env.production` in the `bouncer_app` directory:

```bash
# Supabase Configuration (Production)
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key_here

# Google OAuth Configuration (Production)
GOOGLE_CLIENT_ID=your_production_google_client_id_here
GOOGLE_CLIENT_SECRET=your_production_google_client_secret_here

# Gmail API Configuration (Production)
GMAIL_CLIENT_ID=your_production_gmail_client_id_here
GMAIL_CLIENT_SECRET=your_production_gmail_client_secret_here
GMAIL_REDIRECT_URI=https://yourdomain.com/api/auth/gmail/callback

# Next.js Configuration (Production)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_production_nextauth_secret_here

# Database Configuration (Production)
DATABASE_URL=your_production_database_url_here

# Environment
NODE_ENV=production
```

### Step 2: Get Your Environment Variables

#### Supabase Setup
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project or select existing one
3. Go to Settings > API
4. Copy your `Project URL` and `anon public` key
5. For production, create a separate Supabase project or use the same one

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API and Gmail API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client IDs
5. Set authorized redirect URIs:
   - Local: `http://localhost:3000/api/auth/gmail/callback`
   - Production: `https://yourdomain.com/api/auth/gmail/callback`

### Step 3: Install Dependencies

```bash
cd bouncer_app
npm install
```

## Running the Application

### Local Development

```bash
# Option 1: Use the enhanced npm scripts
npm run dev:local

# Option 2: Switch environment then run
npm run env:local
npm run dev

# Option 3: Traditional way (if .env.local exists)
npm run dev
```

### Production Testing Locally

```bash
# Option 1: Use the enhanced npm scripts
npm run dev:prod

# Option 2: Switch environment then run
npm run env:prod
npm run dev
```

### Building for Production

```bash
# Build with local environment
npm run build:local

# Build with production environment
npm run build:prod
```

## Environment Switching

The package.json now includes helpful scripts for switching between environments:

- `npm run env:local` - Switch to local environment
- `npm run env:prod` - Switch to production environment
- `npm run dev:local` - Run development server with local environment
- `npm run dev:prod` - Run development server with production environment

## Database Setup

### Local Development with Supabase
1. Run any SQL migrations in your Supabase dashboard
2. The `add-gmail-columns.sql` file contains database schema updates

### Production Database
1. Use the same Supabase project or create a separate production instance
2. Run the same migrations on your production database

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Check that all required variables are set in your `.env.local` or `.env.production`
   - The server-side Supabase client will throw an error if variables are missing

2. **Google OAuth Errors**
   - Ensure redirect URIs match exactly in Google Cloud Console
   - Check that the correct client ID and secret are used for each environment

3. **Supabase Connection Issues**
   - Verify your project URL and anon key are correct
   - Check that your Supabase project is active and not paused

4. **Build Errors**
   - Run `npm run type-check` to check for TypeScript errors
   - Run `npm run lint` to fix linting issues

### Environment Variable Debugging

Add this to any API route to debug environment variables (remove in production):

```javascript
console.log('Environment check:', {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
  nodeEnv: process.env.NODE_ENV
});
```

## Security Notes

- Never commit `.env.local`, `.env.production`, or `.env` files to git
- Use different API keys and secrets for local vs production
- Regularly rotate your secrets and API keys
- Use Supabase Row Level Security (RLS) for database protection

## Next Steps

1. Set up your environment variables
2. Test the application locally
3. Set up your production environment
4. Deploy to your hosting platform (Vercel, Netlify, etc.)
5. Update your Google OAuth redirect URIs for production

For any issues, check the console logs and ensure all environment variables are properly set.
