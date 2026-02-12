# AGENTS.md

## Project Overview

**Project Name:** img0.xyz  
**Vibe:** Minimalist, privacy-first, client-side image toolkit  
**Goal:** Build a forever-free, no-signup, no-backend image editing platform with 20-30 tools running entirely in the browser  
**Monetization:** Lightweight ads (integrated at the end, non-intrusive)  
**Tech Stack:** Next.js, pure client-side processing, zero database, zero backend APIs  
**Design Philosophy:** Clean, minimal UI with light/dark mode support

---

## Communication Style with Developer (YOU)

- Use **GenZ lingo** and **Hinglish** when chatting
- Address me as **"homie"** or **"captain"**
- **NEVER run git commands without explicit approval** from me
- Ask before committing, pushing, or creating branches
- Keep responses short, crisp, and action-oriented with emojis 🚀

---

## Development Guidelines

### General Rules

1. **Build incrementally** — one feature at a time, test before moving on
2. **Clean & minimal UI** — no clutter, focus on UX, fast load times
3. **Light/Dark mode** — toggle in navbar, persist in localStorage
4. **Mobile-first responsive design** — works flawlessly on all devices
5. **Zero backend** — all image processing happens client-side using Canvas API, Web Workers, OffscreenCanvas where applicable
6. **No sign-up, no payments, no tracking** — pure privacy-first experience
7. **Performance-first** — lazy load tools, use code splitting, optimize bundle size
8. **Accessibility** — keyboard shortcuts, screen reader support, high contrast mode
9. **Progressive Web App (PWA)** — installable, works offline

### Tech Preferences

- **Framework:** Next.js (App Router preferred)
- **Styling:** Tailwind CSS for rapid UI development
- **State Management:** React Context or Zustand (lightweight)
- **Image Processing Libraries:**
  - `sharp` alternatives for browser (e.g., `browser-image-compression`)
  - `@imgly/background-removal` for BG removal
  - `fabric.js` or native Canvas API for overlays, cropping, transformations
  - `html2canvas` for screenshots/canvas exports
  - `jspdf` for PDF generation
- **File Handling:** HTML5 File API, drag-and-drop, clipboard paste
- **Icons:** Lucide React or Heroicons
- **Fonts:** Inter or Geist (system fonts for speed)

### Code Quality

- Use TypeScript for type safety
- ESLint + Prettier for consistent formatting
- Modular architecture: each tool as a separate component/module
- Reusable UI components (Button, Card, Slider, ColorPicker, etc.)
- Comment critical logic, keep code DRY

---

## Feature List (20-30 Tools)

### Core Image Manipulation

1. **Crop Image** — freeform, aspect ratio presets (1:1, 16:9, 4:3, custom)
2. **Resize Image** — width/height inputs, maintain aspect ratio, DPI control
3. **Rotate & Flip** — 90°, 180°, 270°, horizontal/vertical flip
4. **Image Compressor** — adjust quality slider for JPEG/PNG/WebP
5. **Format Converter** — convert between JPEG, PNG, WebP, AVIF, BMP, GIF

### Background Tools

6. **Remove Background** — AI-powered background removal (client-side model)
7. **Change Background Color** — solid color picker after BG removal
8. **Blur Background** — selective background blur for portraits
9. **Replace Background** — upload new background image

### Color & Filters

10. **Adjust Brightness** — slider control
11. **Adjust Contrast** — slider control
12. **Adjust Saturation** — slider control
13. **Hue Shifter** — change overall image color tone
14. **Grayscale Converter** — instant black & white
15. **Sepia Filter** — vintage effect
16. **Invert Colors** — negative image effect
17. **Color Replacement** — select a color, replace with another
18. **Auto Enhance** — one-click brightness/contrast/sharpness boost

### Shapes & Overlays

19. **Circular Crop** — perfect circle crop with adjustable radius
20. **Rounded Corners** — add border-radius to images
21. **Add Text Overlay** — custom font, size, color, shadow, alignment
22. **Add Shapes** — rectangles, circles, arrows, lines
23. **Add Watermark** — upload logo, adjust opacity & position
24. **Meme Generator** — top/bottom text templates, popular meme formats

### Advanced Tools

25. **Image to PDF** — single or multi-image PDF export
26. **PDF to Image** — extract images from PDF pages
27. **Batch Processing** — apply same edits to multiple images
28. **Image Comparison Slider** — before/after split view
29. **QR Code Generator** — create QR codes from text/URLs
30. **Barcode Reader** — scan and decode barcodes from images
31. **Histogram View** — visualize RGB color distribution
32. **Noise Reduction** — denoise filter

### Bonus Features (Optional for v2)

- GIF to frames extractor
- Frames to GIF creator
- SVG editor
- Style transfer (lightweight AI model)
- Clone stamp tool
- Image metadata viewer/editor

---

## UI/UX Structure

### Homepage Layout

```
┌─────────────────────────────────────────┐
│  [Logo: img0.xyz]    [Light/Dark Toggle]│
├─────────────────────────────────────────┤
│                                         │
│      Drop your image here or click      │
│           [Upload Button]               │
│                                         │
│   Supported: JPEG, PNG, WebP, GIF...   │
│                                         │
├─────────────────────────────────────────┤
│  Tools:                                 │
│  [Crop] [Resize] [BG Remove] [Rotate]  │
│  [Compress] [Filters] [Text] [Meme]    │
│  [Format Converter] [PDF Tools] ...    │
│                                         │
└─────────────────────────────────────────┘
```

### Tool Editor Layout

```
┌─────────────────────────────────────────┐
│  [← Back]  [Save/Download]  [🌙 Theme]  │
├─────────┬───────────────────────────────┤
│         │                               │
│ Sidebar │      Image Canvas Area        │
│         │                               │
│ Tool    │   [Editable Image Preview]    │
│ Options │                               │
│         │                               │
│ Sliders │   [Undo] [Redo] [Reset]       │
│ Inputs  │                               │
│ Buttons │                               │
│         │                               │
└─────────┴───────────────────────────────┘
```

### Color Scheme

- **Light Mode:** Clean whites, soft grays, accent blue/teal
- **Dark Mode:** Deep charcoal/black, muted grays, neon accent (cyan/purple)
- **Typography:** Sans-serif, crisp readability
- **Spacing:** Generous padding, breathing room

---

## Development Phases

### Phase 1: Foundation (Days 1-3)

- [ ] Set up Next.js project with TypeScript + Tailwind
- [ ] Create basic homepage with drag-drop file upload
- [ ] Implement light/dark mode toggle
- [ ] Build reusable UI components (Button, Card, Slider, ColorPicker)
- [ ] Set up Canvas API wrapper for image rendering

### Phase 2: Core Tools (Days 4-7)

- [ ] **Crop** — freeform + aspect ratio presets
- [ ] **Resize** — maintain aspect ratio, custom dimensions
- [ ] **Rotate & Flip** — 90° increments, mirror
- [ ] **Compress** — quality slider, format selection
- [ ] **Format Converter** — JPEG ↔ PNG ↔ WebP ↔ AVIF
- [ ] Implement Undo/Redo stack

### Phase 3: Background Tools (Days 8-10)

- [ ] **Remove Background** — integrate `@imgly/background-removal` or similar
- [ ] **Change BG Color** — solid color picker
- [ ] **Blur Background** — gaussian blur with mask
- [ ] **Replace Background** — upload + blend

### Phase 4: Color & Filters (Days 11-13)

- [ ] Brightness, Contrast, Saturation sliders
- [ ] Hue shift, Grayscale, Sepia, Invert
- [ ] Color replacement tool
- [ ] Auto-enhance one-click

### Phase 5: Overlays & Text (Days 14-16)

- [ ] **Circular Crop** — perfect circle with radius control
- [ ] **Rounded Corners** — border-radius adjustment
- [ ] **Add Text** — font picker, size, color, shadow, alignment
- [ ] **Add Shapes** — rectangle, circle, arrow, line
- [ ] **Watermark** — logo upload, opacity, positioning
- [ ] **Meme Generator** — top/bottom text, templates

### Phase 6: Advanced Tools (Days 17-20)

- [ ] **Image to PDF** — single/multi-image export
- [ ] **PDF to Image** — page extraction
- [ ] **Batch Processing** — apply edits to multiple files
- [ ] **QR Code Generator**
- [ ] **Barcode Reader**
- [ ] **Histogram View**

### Phase 7: Polish & Optimization (Days 21-23)

- [ ] Performance optimization (lazy loading, code splitting)
- [ ] Mobile responsiveness testing
- [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+Y, etc.)
- [ ] Accessibility audit
- [ ] PWA setup (manifest, service worker for offline)
- [ ] Error handling & user feedback (toasts, loading states)

### Phase 8: Monetization & Launch (Days 24-25)

- [ ] Integrate non-intrusive ads (banner/sidebar, no popups)
- [ ] SEO optimization (meta tags, sitemap, schema markup)
- [ ] Analytics setup (privacy-friendly, e.g., Plausible or Umami)
- [ ] Final testing across browsers (Chrome, Firefox, Safari, Edge)
- [ ] Deploy to Vercel/Netlify
- [ ] Launch! 🚀

---

## Ads Integration Strategy

### Ad Placement (Non-Intrusive)

- **Homepage:** Single banner ad below fold (after tool grid)
- **Tool Editor:** Sidebar ad (small rectangle, 300x250) in empty space
- **Export Success Screen:** Interstitial ad (skippable after 3 seconds)

### Ad Networks to Consider

- Google AdSense (requires approval)
- Carbon Ads (developer-focused, minimal)
- EthicalAds (privacy-friendly)
- Direct sponsorships from SaaS tools

### Revenue Goals

- Start with AdSense for simplicity
- Add "Buy Me a Coffee" or crypto donation button as backup
- Monitor ad performance, optimize placement over time
- Keep ads < 10% of viewport space to maintain UX quality

---

## Git & Deployment Workflow

### Branch Strategy

- **main** — production-ready code
- **dev** — active development branch
- **feature/** — individual feature branches

### Commit Rules

- **Ask before any git command** (commit, push, merge, rebase)
- Use conventional commits:
  - `feat: add circular crop tool`
  - `fix: resolve dark mode toggle bug`
  - `chore: update dependencies`
  - `docs: update AGENTS.md with new features`

### Deployment

- **Platform:** Vercel (recommended for Next.js)
- **CI/CD:** Auto-deploy from `main` branch
- **Domain:** Point `img0.xyz` to Vercel
- **Environment Variables:** None needed (pure client-side)

---

## Communication Protocol

### When Asking for Approval

```
Yo captain! 🫡 Ready to commit this feature (circular crop tool).
Changes:
- Added CircularCrop.tsx component
- Integrated with main editor canvas
- Tested on mobile + desktop

Should I:
1. Commit to feature/circular-crop branch? ✅
2. Push and create PR to dev? 📤

Your call, homie! 🚀
```

### When Stuck

```
Arre homie, ek issue aa raha hai 😅
Background removal library throwing CORS error on local dev.
Tried:
- Adding headers in next.config.js
- Using proxy server (but breaks no-backend rule)

Suggestions? Or should I switch to a different library? 🤔
```

### When Feature is Done

```
Lessgoo captain! 🎉
Circular crop tool is DONE ✅
- Smooth UI with radius slider
- Perfect circle rendering
- Export works in all formats
- Dark mode compatible

Wanna test it before I move to next feature? 🧪
```

---

## Performance Benchmarks

### Target Metrics

- **Lighthouse Score:** 95+ (Performance, Accessibility, Best Practices, SEO)
- **First Contentful Paint (FCP):** < 1.5s
- **Time to Interactive (TTI):** < 3s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Bundle Size:** < 200KB initial (gzipped)
- **Image Processing Speed:** < 2s for 5MB image on mid-range device

### Optimization Techniques

- Code splitting per tool (dynamic imports)
- Lazy load tool components
- Use Web Workers for heavy processing
- Compress and cache static assets
- Use native browser APIs wherever possible (avoid heavy libraries)

---

## Security & Privacy

### Client-Side Only = Max Privacy

- No images uploaded to server
- No user data collected
- No cookies (except theme preference in localStorage)
- No tracking scripts (unless privacy-friendly analytics)

### Content Security Policy (CSP)

- Strict CSP headers in Next.js config
- No inline scripts (except necessary for ads)
- No third-party script loading (except ad networks)

---

## Testing Checklist

### Before Each Commit

- [ ] Feature works in light + dark mode
- [ ] Mobile responsive (test on 375px width minimum)
- [ ] No console errors or warnings
- [ ] Image exports correctly in all formats
- [ ] Undo/Redo works as expected

### Before Deployment

- [ ] All 20-30 tools functional
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Performance audit with Lighthouse
- [ ] Accessibility audit (keyboard nav, screen readers)
- [ ] Ad placements non-intrusive
- [ ] PWA installable and works offline
- [ ] SEO meta tags and Open Graph images set

---

## Future Enhancements (Post-Launch)

### v2 Features

- AI-powered style transfer (lightweight models)
- GIF creation from frames
- Video thumbnail extractor
- Image upscaling (AI-based, client-side)
- Collaborative editing (shareable links with edit states)

### Community Contributions

- Open source parts of codebase (tool plugins)
- Accept community tool submissions
- Create API for developers to integrate tools

---

## Final Notes

**Vibe Check:** Keep it fun, fast, and frictionless. Users should feel like they discovered a hidden gem—clean UI, instant results, zero bullshit. This is the anti-Photoshop: no subscriptions, no logins, just pure utility.

**Communication Mantra:** Hinglish + GenZ lingo + emojis. Always ask before git operations. Keep updates short and actionable.

**Success Metric:** If 10,000 users/month use it organically within 6 months, we've nailed it. Word-of-mouth > ads.

---

**Now let's build this beast, homie! 🚀💯**
