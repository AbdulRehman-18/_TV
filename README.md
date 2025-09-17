# Smart Corridor Display

A production-ready MVP web application for managing and displaying announcements on Smart TV displays.

## Features

### 🔐 Authentication System
- Admin login using Supabase Auth (email + password)
- Protected routes with proper auth state management
- Secure session handling

### 📊 Admin Dashboard (`/admin`)
- **Announcement Management Interface**:
  - Create new announcements with title, body, and optional image upload
  - Image upload functionality using Supabase Storage
  - List view of all announcements with CRUD operations
  - Toggle to activate/deactivate announcements
  - Delete functionality with confirmation dialogs
- **Dashboard Overview** with statistics
- **Real-time updates** when announcements change

### 📺 TV Display Page (`/display`)
- **Public access** (no authentication required)
- **Full-screen responsive layout** optimized for Smart TV displays
- **Real-time data fetching** with automatic updates
- **Slideshow functionality**:
  - Cycle through active announcements every 12 seconds
  - Smooth transitions between slides
  - Image announcements: full-width image with title overlay
  - Text announcements: large typography for readability
- **Dark theme** with white text for TV display
- **Progress indicators** and slideshow controls

### 🔄 Real-time Updates
- Supabase Realtime subscriptions
- TV Display updates instantly when admin creates/edits/deletes announcements
- No manual refresh required

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + ShadCN UI
- **Backend**: Supabase (Authentication, Database, Storage, Realtime)
- **Routing**: React Router DOM
- **Styling**: TailwindCSS with custom components
- **Icons**: Lucide React

## Project Structure

```
src/
├── pages/
│   ├── Login.tsx          # Admin login page
│   ├── Admin.tsx          # Protected admin dashboard
│   └── Display.tsx        # Public TV display page
├── components/
│   ├── ui/                # ShadCN UI components
│   ├── AnnouncementCard.tsx   # Announcement management card
│   ├── AnnouncementForm.tsx   # Form for creating/editing announcements
│   └── ProtectedRoute.tsx     # Route protection component
├── lib/
│   ├── supabase.ts        # Supabase client configuration
│   └── utils.ts           # Utility functions
├── hooks/
│   └── useAuth.ts         # Authentication hook
└── types/
    └── index.ts           # TypeScript type definitions
```

## Setup Instructions

### 1. Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Set up the database** by running this SQL in your Supabase SQL editor:

```sql
-- Create announcements table
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admins)
CREATE POLICY "Authenticated users can read announcements"
ON announcements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert announcements"
ON announcements FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update announcements"
ON announcements FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete announcements"
ON announcements FOR DELETE
TO authenticated
USING (true);

-- Allow public read access for the display page
CREATE POLICY "Public can read active announcements"
ON announcements FOR SELECT
TO anon
USING (is_active = true);

-- Create storage bucket for announcement images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('announcements', 'announcements', true);

-- Create storage policy for authenticated users
CREATE POLICY "Authenticated users can upload announcement images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'announcements');

CREATE POLICY "Anyone can view announcement images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'announcements');
```

3. **Create an admin user** in Supabase Auth:
   - Go to Authentication > Users in your Supabase dashboard
   - Click "Add user" and create an admin account

4. **Get your Supabase credentials**:
   - Go to Settings > API in your Supabase dashboard
   - Copy your Project URL and anon public key

### 2. Frontend Setup

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Start the development server**:
```bash
npm run dev
```

### 3. Sample Data

You can create sample announcements through the admin interface, or insert them directly in Supabase:

```sql
INSERT INTO announcements (title, body, is_active) VALUES 
('Welcome Message', 'Welcome to our Smart Corridor Display system. Stay updated with the latest announcements and information.', true),
('Safety Reminder', 'Please remember to follow all safety protocols while in the building. Your safety is our top priority.', true),
('Event Notification', 'Join us for the monthly team meeting this Friday at 2 PM in Conference Room A.', true),
('Maintenance Notice', 'Scheduled maintenance will occur this weekend. Some services may be temporarily unavailable.', false),
('Holiday Announcement', 'The office will be closed on Monday in observance of the holiday. Have a great long weekend!', true);
```

## Usage

### Admin Access
1. Navigate to `/login`
2. Sign in with your admin credentials
3. Access the dashboard at `/admin`
4. Create, edit, and manage announcements

### TV Display
1. Navigate to `/display` (or just `/`)
2. The page will automatically cycle through active announcements
3. Optimized for fullscreen viewing on Smart TVs

### Key Features
- **Real-time updates**: Changes made in admin are immediately reflected on display
- **Image support**: Upload images for visual announcements
- **Responsive design**: Works on desktop, tablet, and TV displays
- **Slideshow controls**: Automatic progression with visual indicators
- **Active/Inactive toggle**: Control which announcements are displayed

## Deployment

### Vercel Deployment

1. **Build the project**:
```bash
npm run build
```

2. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically on push

### Environment Variables for Production
Make sure to set these in your deployment environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Organization

- Components are modular and reusable
- TypeScript for type safety
- Proper error handling and loading states
- Responsive design with TailwindCSS
- Real-time subscriptions for live updates

## License

MIT License - feel free to use this project for your needs.