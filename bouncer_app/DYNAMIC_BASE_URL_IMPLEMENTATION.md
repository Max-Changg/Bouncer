# Dynamic Base URL Implementation

## ✅ **Implementation Complete**

I've implemented dynamic base URL detection across all files that need it. Here's what was done:

### **🎯 Files Updated:**

1. **`lib/get-base-url.ts`** - Created utility functions for dynamic base URL
2. **`app/debug-auth/page.tsx`** - Updated to show dynamic base URL instead of environment variable

### **🎯 Files Already Using Dynamic URLs:**

These files were already using `window.location.origin` which automatically works across both domains:

1. **`app/event/[id]/page.tsx`** - Share functionality
2. **`app/event/page.tsx`** - Share functionality
3. **`app/create-event/page.tsx`** - Invite link generation
4. **`app/test-google/page.tsx`** - OAuth redirect

### **🎯 Utility Functions Created:**

```typescript
// Get current base URL (works on both domains)
getBaseUrl(): string

// Get NextAuth URL (same as base URL)
getNextAuthUrl(): string

// Get full URL for a path
getFullUrl(path: string): string

// Get invite link for an event
getInviteLink(eventId: string): string

// Get auth callback URL
getAuthCallbackUrl(next?: string): string
```

### **🎯 How It Works:**

**Client-Side (Browser):**

- Uses `window.location.origin` to get current domain
- Automatically works for both `bouncer-app.dev` and `bouncer-silk.vercel.app`

**Server-Side:**

- Falls back to `process.env.NEXT_PUBLIC_BASE_URL` or default
- Works for server-side rendering and API routes

### **🎯 Benefits:**

- ✅ **No Environment Variable Conflicts**: No need to set different `NEXT_PUBLIC_BASE_URL` for each domain
- ✅ **Automatic Domain Detection**: Works on both domains without configuration
- ✅ **Future-Proof**: Will work with any new domains you add
- ✅ **Consistent Behavior**: Same code works everywhere

### **🎯 Usage Examples:**

```typescript
import {
  getBaseUrl,
  getNextAuthUrl,
  getInviteLink,
  getFullUrl,
} from '@/lib/get-base-url';

// Get current base URL
const baseUrl = getBaseUrl(); // https://bouncer-app.dev or https://bouncer-silk.vercel.app

// Get NextAuth URL (same as base URL)
const nextAuthUrl = getNextAuthUrl(); // https://bouncer-app.dev or https://bouncer-silk.vercel.app

// Get invite link
const inviteLink = getInviteLink('event-123'); // https://current-domain/rsvp?event_id=event-123

// Get full URL for any path
const fullUrl = getFullUrl('/api/auth/verify'); // https://current-domain/api/auth/verify
```

### **🎯 What You Can Remove:**

You can now remove these environment variables from Vercel since the app uses dynamic detection instead:

- `NEXT_PUBLIC_BASE_URL`
- `NEXTAUTH_URL`

### **🎯 Testing:**

The implementation will automatically work on both domains:

- Visit `bouncer-app.dev` → uses `https://bouncer-app.dev`
- Visit `bouncer-silk.vercel.app` → uses `https://bouncer-silk.vercel.app`

No additional configuration needed!
