# Smart Corridor Display - Deployment Guide

This guide walks you through deploying the Smart Corridor Display application to production using Vercel for the frontend and Supabase Cloud for the backend.

## Prerequisites

- Node.js 18+ installed locally
- Git repository with your code
- Supabase account
- Vercel account

## Step 1: Supabase Cloud Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `smart-corridor-display`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for setup to complete (~1-2 minutes)

### 1.2 Configure Database

1. Go to the **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy and paste the content from `supabase/migrations/create_announcements_table.sql`
4. Click "Run" to execute the migration
5. Run the seed data by copying content from `supabase/migrations/seed_sample_data.sql`
6. Click "Run" to add sample announcements

### 1.3 Create Admin User

1. Go to **Authentication > Users**
2. Click "Add user"
3. Fill in admin details:
   - **Email**: `admin@yourdomain.com`
   - **Password**: Generate a strong password
   - **Email Confirm**: Toggle OFF
4. Click "Create user"
5. Save the credentials securely

### 1.4 Get API Credentials

1. Go to **Settings > API**
2. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 2: Frontend Deployment to Vercel

### 2.1 Prepare Repository

1. Ensure your code is pushed to GitHub, GitLab, or Bitbucket
2. Make sure your `.env.example` file is included but `.env` is in `.gitignore`

### 2.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your repository
4. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)

### 2.3 Add Environment Variables

1. In the Vercel project settings, go to "Environment Variables"
2. Add the following variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Make sure to add them for all environments (Production, Preview, Development)

### 2.4 Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Test your live application

### 2.5 Ensure SPA routing (avoids 404 on refresh)

Single Page Apps (like this React + Vite app) need a fallback so deep links such as `/admin` or `/display` load `index.html` and let the client router take over. If you visit `/admin` and see a 404 from Vercel, add a rewrite.

Two options:

1) Commit a `vercel.json` file (already included):

```
{
   "routes": [
      { "handle": "filesystem" },
      { "src": "/(.*)", "dest": "/index.html" }
   ]
}
```

2) Or configure in the Vercel Dashboard:

- Go to Project → Settings → Functions → Rewrites
- Add: Source: `/(.*)` Destination: `/index.html`

Redeploy after adding the rewrite. Then `/admin` and other routes will work on direct navigation and refresh.

## Step 3: Post-Deployment Configuration

### 3.1 Configure Supabase URL Settings

1. In Supabase dashboard, go to **Settings > API**
2. Scroll to "Site URL"
3. Add your Vercel domain: `https://your-app.vercel.app`
4. Add redirect URLs for authentication:
   ```
   https://your-app.vercel.app/admin
   https://your-app.vercel.app/login
   ```

### 3.2 Test the Application

1. **Test TV Display**:
   - Visit `https://your-app.vercel.app/display`
   - Verify announcements are loading
   - Check slideshow functionality

2. **Test Admin Panel**:
   - Visit `https://your-app.vercel.app/login`
   - Sign in with admin credentials
   - Create/edit announcements
   - Upload images
   - Test real-time updates between admin and display

## Step 4: Optional Optimizations

### 4.1 Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs with new domain

### 4.2 Performance Optimizations

1. **Enable Vercel Analytics**:
   - Go to "Analytics" tab in Vercel dashboard
   - Enable Web Analytics

2. **Configure CDN**:
   - Vercel automatically provides global CDN
   - No additional configuration needed

### 4.3 Security Hardening

1. **Supabase RLS Review**:
   - Verify Row Level Security policies are working
   - Test with different user roles

2. **Environment Variables**:
   - Ensure no sensitive data in client-side code
   - All secrets properly configured in Vercel

## Step 5: Monitoring and Maintenance

### 5.1 Set Up Monitoring

1. **Vercel Monitoring**:
   - Monitor deployments in Vercel dashboard
   - Set up deployment notifications

2. **Supabase Monitoring**:
   - Monitor database usage
   - Check API request logs
   - Monitor storage usage

### 5.2 Backup Strategy

1. **Database Backup**:
   - Supabase provides automatic backups
   - Consider additional backup strategy for critical data

2. **Image Storage**:
   - Supabase Storage is automatically replicated
   - Monitor storage usage and costs

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**:
   - Ensure variables start with `VITE_`
   - Redeploy after adding environment variables

2. **Supabase Connection Issues**:
   - Verify URL and API keys are correct
   - Check network connectivity
   - Review browser console for errors

3. **Authentication Issues**:
   - Verify redirect URLs in Supabase settings
   - Check authentication policies
   - Ensure admin user is created

4. **Real-time Updates Not Working**:
   - Check Supabase real-time is enabled
   - Verify WebSocket connections
   - Check browser developer tools for connection errors

### Support Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Project Issues**: Create GitHub issues for bug reports

## Final Checklist

- [ ] Supabase project created and configured
- [ ] Database tables created with proper RLS policies
- [ ] Storage bucket created with correct policies
- [ ] Admin user created in Supabase Auth
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured in Vercel
- [ ] Custom domain configured (if applicable)
- [ ] Both display and admin interfaces tested
- [ ] Real-time functionality verified
- [ ] Image upload functionality tested
- [ ] Monitoring and analytics set up

Your Smart Corridor Display is now live and ready for production use! 🎉

## Local development: expose dev server to your LAN

If you want to run the Vite dev server on your development machine and access it from other devices on the same network (for example a TV or phone), follow these steps.

1) Start Vite bound to all interfaces

- You can run the provided script which starts Vite listening on 0.0.0.0:

   npm run dev:lan

- Or run directly with the host flag:

   npm run dev -- --host

The project `vite.config.ts` already sets `server.host = true` so `vite` will listen on 0.0.0.0. The default port is 5173.

2) Allow the port through Windows Firewall (PowerShell)

- Open PowerShell as Administrator and run (replace 5173 with your port if different):

   New-NetFirewallRule -DisplayName "Vite Dev Server 5173" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow

- To remove the rule later:

   Remove-NetFirewallRule -DisplayName "Vite Dev Server 5173"

If you prefer a GUI, open "Windows Defender Firewall with Advanced Security" and create an inbound rule allowing TCP on the dev port.

3) Find your machine's local IP

- In PowerShell:

   ipconfig

- Look for the IPv4 Address on the active adapter (e.g., 192.168.1.42).

4) Access from another device

- On the device (TV/phone) open a browser and visit:

   http://<YOUR_MACHINE_IP>:5173

For example: http://192.168.1.42:5173

5) Alternatives if you can't change firewall / network settings

- Use ngrok (tunnel) to expose a secure public URL without firewall changes:

   - Install ngrok and run: ngrok http 5173
   - Visit the generated https URL from any device.

- Use localtunnel: npx localtunnel --port 5173

Notes and gotchas

- Some corporate or school networks block device-to-device traffic on Wi-Fi. If devices are on different subnets (guest vs LAN), they may not see each other.
- If you run into CORS or host header issues, the `--host` flag and `server.host = true` in Vite solve the common cases for local dev.

If you'd like, I can also add an npm script to run ngrok automatically or a short troubleshooting checklist for TVs (captive portals, captive DNS, etc.).