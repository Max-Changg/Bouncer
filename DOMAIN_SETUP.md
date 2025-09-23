# Bouncer Domain Fallback Setup Guide

This guide explains how to set up your domain (`bouncer-app.dev`) to fall back to the Vercel deployment (`https://bouncer-silk.vercel.app/`) with proper redirects.

## 🎯 What We've Implemented

### ✅ **Code Changes Made:**

1. **Next.js Redirects Configuration** (`next.config.ts`)

   - Added comprehensive redirect rules for all routes
   - Redirects from `bouncer-app.dev` to `https://bouncer-silk.vercel.app/`
   - Preserves all URL paths and query parameters

2. **Fallback HTML Page** (`public/fallback.html`)

   - Static HTML page for when domain resolution fails
   - Auto-redirects to Vercel deployment
   - Styled to match Bouncer branding

3. **Custom 404 Page** (`app/not-found.tsx`)
   - Handles cases where routes aren't found
   - Auto-redirects to Vercel deployment
   - Provides manual redirect button

## 🔧 Domain Configuration Options

### **Option 1: DNS CNAME Record (Recommended)**

**Steps:**

1. Go to your domain registrar (where you bought `bouncer-app.dev`)
2. Find DNS management settings
3. Add a CNAME record:
   - **Name/Host**: `@` (or leave blank for root domain)
   - **Value/Target**: `cname.vercel-dns.com`
   - **TTL**: 3600 (or default)

**Result**: All traffic to `bouncer-app.dev` goes directly to Vercel

### **Option 2: DNS A Record**

**Steps:**

1. Get Vercel's IP address: `76.76.19.61` (current Vercel IP)
2. Add an A record:
   - **Name/Host**: `@`
   - **Value**: `76.76.19.61`
   - **TTL**: 3600

**Note**: IP addresses can change, CNAME is more reliable

### **Option 3: Subdomain Setup**

If you can't modify the root domain:

**Steps:**

1. Add CNAME record for `app.bouncer-app.dev` → `cname.vercel-dns.com`
2. Update redirects in `next.config.ts` to use `app.bouncer-app.dev`
3. Redirect `bouncer-app.dev` → `app.bouncer-app.dev`

## 🚀 Vercel Configuration

### **Custom Domain Setup:**

1. Go to your Vercel dashboard
2. Select your Bouncer project
3. Go to Settings → Domains
4. Add `bouncer-app.dev` as a custom domain
5. Follow Vercel's DNS verification steps

### **Environment Variables:**

Make sure these are set in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Any other environment variables your app needs

## 🔄 How It Works

### **Normal Operation:**

1. User visits `bouncer-app.dev/rsvp`
2. DNS resolves to Vercel
3. Vercel serves your app directly
4. No redirects needed

### **Fallback Operation:**

1. User visits `bouncer-app.dev/rsvp`
2. DNS fails or points elsewhere
3. Next.js redirects detect the domain
4. User gets redirected to `https://bouncer-silk.vercel.app/rsvp`

### **Complete Failure:**

1. User visits `bouncer-app.dev/rsvp`
2. Domain can't be resolved at all
3. Browser shows "connection failed" or similar
4. User can manually visit `https://bouncer-silk.vercel.app/rsvp`

## 📋 Routes Covered

All these routes will redirect properly:

- `/` → `https://bouncer-silk.vercel.app/`
- `/rsvp` → `https://bouncer-silk.vercel.app/rsvp`
- `/create-event` → `https://bouncer-silk.vercel.app/create-event`
- `/event` → `https://bouncer-silk.vercel.app/event`
- `/event/[id]` → `https://bouncer-silk.vercel.app/event/[id]`
- `/my-rsvps` → `https://bouncer-silk.vercel.app/my-rsvps`
- `/qr-code` → `https://bouncer-silk.vercel.app/qr-code`
- `/login` → `https://bouncer-silk.vercel.app/login`
- Any other route → `https://bouncer-silk.vercel.app/[same-route]`

## 🧪 Testing

### **Test the Setup:**

1. **Deploy to Vercel:**

   ```bash
   npm run build
   vercel --prod
   ```

2. **Test redirects:**

   - Visit `bouncer-app.dev/rsvp`
   - Should redirect to `https://bouncer-silk.vercel.app/rsvp`

3. **Test fallback:**
   - Temporarily change DNS to point elsewhere
   - Visit `bouncer-app.dev/rsvp`
   - Should still redirect properly

### **Browser Testing:**

Test in different scenarios:

- ✅ Normal DNS resolution
- ✅ DNS pointing to wrong server
- ✅ DNS not resolving
- ✅ Mobile browsers
- ✅ Different network conditions

## 🛠️ Troubleshooting

### **Common Issues:**

1. **Redirects not working:**

   - Check DNS propagation (can take 24-48 hours)
   - Verify Vercel domain configuration
   - Check Next.js redirects syntax

2. **Infinite redirects:**

   - Make sure redirects use `permanent: false`
   - Check that destination URLs are correct

3. **404 errors:**
   - Verify all routes are covered in redirects
   - Check Vercel deployment has all routes

### **Debug Commands:**

```bash
# Check DNS resolution
nslookup bouncer-app.dev

# Check if domain resolves to Vercel
dig bouncer-app.dev

# Test redirects locally
npm run dev
# Visit localhost:3000 with Host header set to bouncer-app.dev
```

## 📞 Support

If you need help:

1. Check Vercel's documentation on custom domains
2. Contact your domain registrar for DNS help
3. Verify all environment variables are set correctly

The setup should provide seamless fallback to the Vercel deployment in all scenarios!
