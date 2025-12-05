# Distro - Music Streaming for Artists

A lo-fi, artist-centric music streaming platform where users can manage multiple bands and upload music.

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Database/Auth:** Supabase (Postgres, Auth, Storage)
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI
- **Icons:** Lucide React
- **State Management:** Zustand

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Database Migrations

Run the SQL migrations in your Supabase SQL editor:

1. `migrations/001_initial_schema.sql` - Creates tables and RLS policies
2. `migrations/002_storage_buckets.sql` - Sets up storage buckets

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Tables

- **profiles**: User profiles linked to auth.users
- **bands**: Music bands/artists managed by users
- **albums**: Music albums belonging to bands
- **tracks**: Individual tracks within albums

### Storage Buckets

- **covers**: Album cover images (public access)
- **audio**: Audio files (authenticated access for MVP)

## Features

- ✅ User authentication with Supabase Auth
- ✅ Multi-tenant band management
- ✅ Persistent audio player with Zustand
- ✅ Responsive UI with Shadcn components
- ✅ Server-side data fetching with Server Components

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # User dashboard
│   ├── login/            # Authentication page
│   └── band/[slug]/      # Band management page
├── components/            # Reusable components
│   ├── ui/               # Shadcn UI components
│   └── audio-player.tsx  # Audio player component
├── lib/                  # Utilities and configurations
│   ├── stores/           # Zustand stores
│   ├── supabase-*.ts     # Supabase client configurations
│   └── utils.ts          # Utility functions
└── types/                # TypeScript type definitions
    └── database.ts       # Database schema types
```

## Next Steps

- [ ] Implement album upload functionality with file handling
- [ ] Add track listing and playback
- [ ] Implement playlist management
- [ ] Add search and discovery features
- [ ] Mobile app development