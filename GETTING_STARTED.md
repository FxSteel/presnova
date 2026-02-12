# Nova - Getting Started Guide

## Quick Setup (5 minutes)

### 1. **Configure Environment Variables**

Copy your Supabase credentials into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Where to find these:**
- Go to your Supabase project dashboard
- Click Settings → API
- Copy the URL and Anonymous key (public)

### 2. **Install & Run**

```bash
npm install
npm run dev
```

Your app will be at: **http://localhost:3000**

---

## First-Time User Walkthrough

### Register
1. Go to the login page
2. Click "¿No tienes cuenta? Regístrate"
3. Enter email, password, and full name
4. Click "Registrarse"
5. You're logged in!

### Create Your First Song
1. Go to the **Operador** page (already selected)
2. Click **+ Nueva canción** button
3. Fill in:
   - **Título** (required): "Amazing Song"
   - **Autor**: "Your Name"
   - **Tonalidad**: "Am" or any key
   - **BPM**: (optional) "120"
4. Click **Crear**

### Add Slides to Your Song
1. Your song appears in the left column
2. Click on it to select
3. In the middle column, click **Nueva** button
4. A new slide appears in the grid
5. Click the slide card to edit it

### Edit a Slide
1. Click on any slide card
2. Modal opens with:
   - **Tipo de Diapositiva**: verse, chorus, bridge, etc.
   - **Etiqueta**: Optional label
   - **Contenido**: Your slide text
3. Click **Guardar cambios**

### Preview Output
1. Select a song and slides
2. Right column shows **Salida en Vivo**
3. Use **Anterior** / **Siguiente** to navigate slides
4. Click **Logo ON/OFF** to toggle between:
   - **ON**: Shows logo, hides lyrics (for projection)
   - **OFF**: Shows slide content

### Go to Settings
1. Click **Configuración** in sidebar
2. Set your language, theme, and upload workspace logo
3. Click **Guardar cambios**

---

## Project Routes

| Route | Purpose |
|-------|---------|
| `/` | Redirects to /operator or /auth/login |
| `/auth/login` | Login & registration page |
| `/operator` | Main app with 3-column layout |
| `/settings` | Workspace settings & preferences |

---

## Key Features

### 3-Column Layout
1. **Left**: Song list with "+ Nueva canción" button
2. **Middle**: Song details, slides grid, edit buttons
3. **Right**: Live preview output screen

### Song Management
- Create songs with metadata
- Edit song details anytime
- Soft delete (archive) songs
- See all songs for current workspace

### Slide Types
- verse, chorus, bridge
- intro, outro, pre-chorus
- Custom labels for organization

### Live Output
- Real-time preview
- Logo toggle mode
- Slide navigation
- Projection-ready display

### Settings
- Language: Spanish (es), English (en), Portuguese (pt)
- Theme: System, Light, Dark
- Logo: Upload for workspace branding

---

## Development Commands

```bash
# Start dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## Database (Reference)

Your app uses these Supabase tables (read-only - do NOT modify):

- `profiles` - Your user profile
- `workspaces` - Team workspaces
- `workspace_members` - Your workspace memberships
- `workspace_settings` - Workspace preferences
- `songs` - Your songs
- `song_slides` - Slide content

**Key constraint**: User can only see/edit songs in their active workspace (enforced by RLS).

---

## Troubleshooting

### Can't login?
- Check email exists in Supabase
- Verify password is correct
- Check browser console for errors

### Songs not appearing?
- Make sure you're in a workspace
- Check that songs aren't archived
- Try refreshing the page

### Slides not showing?
- Click on a song first
- Click "+ Nueva" to add slides
- Wait for content to load

### Build fails?
- Ensure .env.local has correct Supabase URL & key
- Run `npm install` again
- Delete `.next` folder and rebuild

---

## Deployment to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Nova app ready for deployment"
git push origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click "Deploy"

Your app will be live in minutes!

---

## UI Customization

### Colors (Tailwind + Dark Theme)
- **Primary Purple**: `#7C6FD8`
- **Background**: `#0f0f0f`
- **Cards**: `#1a1a1a`
- **Borders**: `#333`

### Modify in:
- `tailwind.config.ts` - Color definitions
- `app/globals.css` - Component styles
- Component files - Individual styling

---

## Next Steps

- Explore the operator page with sample data
- Check settings page to customize your workspace
- Read code comments in components
- Refer to README.md for full documentation

---

**Happy operating! 🎵**
