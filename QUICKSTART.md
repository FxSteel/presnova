# 🚀 Quick Start Guide - Nova Song Operator

## ⚡ 5-Minute Setup

### 1. Get Supabase Credentials
- Go to your Supabase project settings → API
- Copy: `Project URL` and `Anon Key`

### 2. Configure Environment
```bash
cd /Users/fer/Desktop/nova
# Edit .env.local
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EOF
```

### 3. Run Development Server
```bash
npm run dev
# Open: http://localhost:3000
```

### 4. First Time Setup
1. Go to login page
2. Click "¿No tienes cuenta? Regístrate"
3. Create account with email/password
4. You'll be assigned a workspace
5. Click "+ Nueva canción" to create your first song
6. Add slides and test the output preview

---

## 📋 First Use Checklist

- [ ] Environment variables configured in `.env.local`
- [ ] Dev server running at localhost:3000
- [ ] Can login/register
- [ ] Can create a song
- [ ] Can add slides to song
- [ ] Can edit slides
- [ ] Can view output preview
- [ ] Logo toggle works
- [ ] Settings page accessible

---

## 🎯 Main Features to Try

### Create & Edit Songs
1. **Operator** page → "+ Nueva canción"
2. Fill in title, author, tonality, BPM
3. Click "Crear"
4. Click "Editar" to modify

### Manage Slides
1. Select a song
2. Click "Nueva" to add a slide
3. Click on slide card to edit
4. Choose type (verse, chorus, bridge, etc)
5. Add content and save

### Live Output
1. Select a song and slide
2. Use **Anterior/Siguiente** to navigate
3. Toggle **Logo: ON/OFF** to switch between logo and text view
4. Preview shows exactly what would be projected

### Settings
1. Go to **Configuración** in sidebar or user menu
2. Change language
3. Select theme (light/dark/system)
4. Upload workspace logo
5. Save changes

---

## 🗺️ Navigation Map

```
Home (/)
  ↓
Login (/auth/login)
  ↓
Operator (/operator) ← Main App
  ├── 3-column layout
  ├── Left: Song list
  ├── Middle: Song details & slides
  └── Right: Live preview
  
Settings (/settings)
  ├── Language
  ├── Theme
  └── Logo upload
```

---

## 📱 Keyboard Shortcuts

| Action | Key |
|--------|-----|
| Navigate to Operator | `Ctrl/Cmd` + `O` (not yet) |
| Navigate to Settings | `Ctrl/Cmd` + `,` (not yet) |
| Create Song | `Ctrl/Cmd` + `N` (not yet) |
| Search Songs | `Ctrl/Cmd` + `/` (not yet) |

*Future enhancements*

---

## 🐛 Troubleshooting

### "supabaseUrl is required"
→ Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`

### Can't login
→ Verify email/password is correct in Supabase Auth

### No songs showing
→ Make sure workspace has songs created

### Layout looks broken
→ Try hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R`)

### Can't upload logo
→ Make sure Supabase Storage bucket exists

---

## 📞 Need Help?

1. **Read**: [README.md](./README.md) - Full documentation
2. **Check**: [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - Technical details
3. **Review**: Source code in `app/` and `components/` folders
4. **Debug**: Check browser console for errors

---

## ✨ Next Steps After Setup

1. **Customize Colors**: Edit `tailwind.config.ts`
2. **Add More Slide Types**: Modify dropdown in `EditSlideModal.tsx`
3. **Deploy**: Push to GitHub, connect to Vercel
4. **Extend Features**: Add Bible API, more settings, etc.

---

## 🎨 Default Theme

- **Dark Background**: #0f0f0f
- **Card Bg**: #1a1a1a
- **Purple Accent**: #7C6FD8
- **Language**: Spanish (configurable in settings)

---

## 📦 What's Included

✅ Full Next.js application
✅ Auth system (Supabase)
✅ Song & slide management
✅ Live output preview
✅ Settings page
✅ Responsive design
✅ Dark theme
✅ Production-ready

---

**Happy singing! 🎵**

For detailed docs, see [README.md](./README.md)
