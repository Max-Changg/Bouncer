# Supabase Cross-Domain Configuration Guide

## 🚨 **Critical Issue Identified**

When users are redirected from `bouncer-app.dev` to `bouncer-silk.vercel.app`, they'll be using different environment variables, which will cause:

- ❌ Database connection failures
- ❌ Authentication errors
- ❌ Data inconsistency between domains

## ✅ **Solution: Unified Supabase Configuration**

### **Option 1: Same Supabase Project (Recommended)**

Use the same Supabase project for both domains:

#### **Steps:**

1. **Choose Your Primary Supabase Project**
   - Use the Supabase project that has all your data
   - This should be the one currently configured for `bouncer-app.dev`

2. **Update Vercel Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Set the SAME values for both domains:

   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
   ```

3. **Update Supabase Auth Settings**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add both domains to "Site URL" and "Redirect URLs":
     ```
     Site URL: https://bouncer-app.dev
     Redirect URLs:
       - https://bouncer-app.dev/**
       - https://bouncer-silk.vercel.app/**
     ```

4. **Update CORS Settings**
   - In Supabase Dashboard → Settings → API
   - Add both domains to allowed origins:
     ```
     https://bouncer-app.dev
     https://bouncer-silk.vercel.app
     ```

### **Option 2: Database Replication (Advanced)**

If you need separate Supabase projects:

1. **Set up database replication** between projects
2. **Use Supabase Edge Functions** for cross-project communication
3. **Implement data synchronization** logic

## 🔧 **Environment Variables Setup**

### **For Vercel Deployment:**

```bash
# Production Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **For Local Development:**

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🔐 **Authentication Configuration**

### **Supabase Auth Settings:**

1. **Site URL**: `https://bouncer-app.dev`
2. **Redirect URLs**:
   - `https://bouncer-app.dev/auth/callback`
   - `https://bouncer-silk.vercel.app/auth/callback`
   - `https://bouncer-app.dev/**`
   - `https://bouncer-silk.vercel.app/**`

3. **JWT Settings**:
   - Ensure JWT expiry is reasonable (default: 3600 seconds)
   - Enable refresh tokens

### **OAuth Providers (Google, etc.):**

Update OAuth redirect URIs:

- `https://bouncer-app.dev/auth/callback`
- `https://bouncer-silk.vercel.app/auth/callback`

## 🧪 **Testing the Configuration**

### **Test Database Connectivity:**

1. **From bouncer-app.dev:**

   ```javascript
   // Test in browser console
   const supabase = createClient();
   supabase.from('Events').select('*').limit(1);
   ```

2. **From bouncer-silk.vercel.app:**
   ```javascript
   // Test in browser console
   const supabase = createClient();
   supabase.from('Events').select('*').limit(1);
   ```

### **Test Authentication:**

1. **Login on bouncer-app.dev**
2. **Navigate to bouncer-silk.vercel.app**
3. **Verify session persists**

### **Test Data Operations:**

1. **Create event on bouncer-app.dev**
2. **View event on bouncer-silk.vercel.app**
3. **Verify data is consistent**

## 🚨 **Common Issues & Solutions**

### **Issue 1: CORS Errors**

```
Error: CORS policy blocks request
```

**Solution**: Add both domains to Supabase CORS settings

### **Issue 2: Authentication Failures**

```
Error: Invalid JWT token
```

**Solution**: Update redirect URLs in Supabase Auth settings

### **Issue 3: Database Connection Errors**

```
Error: Failed to fetch
```

**Solution**: Verify environment variables are identical

### **Issue 4: Session Not Persisting**

```
User logged out after redirect
```

**Solution**: Update cookie domain settings in Supabase

## 📋 **Deployment Checklist**

Before deploying:

- [ ] Environment variables set in Vercel for both domains
- [ ] Supabase Auth URLs updated
- [ ] CORS settings configured
- [ ] OAuth redirect URIs updated
- [ ] Database connectivity tested
- [ ] Authentication flow tested
- [ ] Data operations tested

## 🔄 **Migration Steps**

If you need to migrate from separate Supabase projects:

1. **Export data** from old project
2. **Import data** to new project
3. **Update environment variables**
4. **Test all functionality**
5. **Update DNS/redirects**
6. **Monitor for issues**

## 📞 **Support**

If you encounter issues:

1. Check Supabase logs in dashboard
2. Verify environment variables match
3. Test database connectivity
4. Check browser network tab for errors
5. Review Supabase documentation

The key is ensuring both domains use the same Supabase project and configuration!
