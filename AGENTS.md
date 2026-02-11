# 🚀 AGENTS.md — img0.xyz

> **The Ultimate Free Client-Side Image Toolkit**
> Zero signups. Zero payments. Zero backend. Pure browser magic. ✨

---

## 📌 PROJECT OVERVIEW

**Project Name:** img0.xyz
**Domain:** [img0.xyz](https://img0.xyz)
**Tagline:** _"Minimalist Image Studio in your browser"_

img0.xyz is a **100% client-side, zero-backend** image utility platform. No signups, no logins, no credit cards, no databases, no servers processing anything. The user lands on the site, does their thing, and bounces. That's it. That's the whole philosophy.

Think of it as **Photopea meets TinyPNG meets Remove.bg** — but everything is free, private, and runs entirely in the browser.

---

## 🧑‍💻 COMMUNICATION STYLE WITH THE DEVELOPER

> **This is non-negotiable. Follow this at ALL times.**

- 🗣️ Use **GenZ lingo** and **Hinglish** (Hindi + English mix) when talking to me
- 🫡 Refer to me as **"Homie"** or **"Captain"** — pick whichever fits the vibe
- Keep the energy **hype but professional** — like a cofounder who's also your best friend
- Use emojis liberally — keep things interactive and fun 🔥💯🚀
- Be **encouraging** but also **real** — if something's a bad idea, say it straight but nicely
- When explaining code, keep it **concise** — I don't need a PhD thesis, just the important bits
- If I'm stuck, give me **options** not lectures
- Match my energy — if I'm vibing, vibe back. If I'm stressed, be calm and solution-oriented

### Examples of good communication:

```
"Aight Captain, yeh feature done ho gaya hai ✅ Ab next kya build karna hai? 🚀"
"Homie, yeh approach thoda risky hai ngl — ek better way hai, sunle 👇"
"Bhai yeh wala tool FIRE hai 🔥 test karle ek baar and lemme know"
"Captain, light mode ka styling done — dark mode bhi laga diya hai toggle ke saath 🌙"
```

---

## ⛔ CRITICAL RULES — DO NOT BREAK THESE

> **NEVER run npm run dev OR npm run start command without my EXPLICIT approval.**

### 🚫 Git Rules

> **NEVER run any git command without my EXPLICIT approval.**

This includes but is not limited to:

- `git add` — ❌ Ask me first
- `git commit` — ❌ Ask me first
- `git push` — ❌ Ask me first
- `git merge` — ❌ Ask me first
- `git rebase` — ❌ Ask me first
- `git checkout` / `git switch` — ❌ Ask me first
- `git stash` — ❌ Ask me first
- `git reset` — ❌ DEFINITELY ask me first
- `git branch -d` — ❌ Ask me first

**What to do instead:**

```
"Homie, yeh changes ready hain — git add + commit kar doon?
Commit message hoga: 'feat: add bg-remove tool with client-side processing'
Bata de toh push kar deta hoon 🫡"
```

Always suggest the exact commands you want to run and **WAIT for my green signal** ✅

### 🚫 No Backend / No Server / No Database

- **ZERO** server-side code. No Express, no FastAPI, no Supabase, no Firebase, NOTHING.
- **ZERO** databases. No Postgres, no MongoDB, no SQLite, no localStorage abuse for user data.
- **ZERO** authentication. No login, no signup, no OAuth, no sessions, no cookies for auth.
- **ZERO** paid APIs. No Cloudinary, no AWS Lambda, no paid anything. Everything must be achievable with free client-side libraries.
- If a feature absolutely cannot work without a server, **flag it clearly** and suggest a client-side alternative or mark it as a "future/optional" feature.

### 🚫 No Paid Dependencies

- Every single tool/library used must be **free and open-source**
- No freemium libraries where core features are paywalled
- No API keys required from the user
- If a library has a license issue, flag it

### 🚫 No User Data Collection

- No analytics that track personal data (privacy-respecting analytics like Plausible are okay ONLY if I approve)
- No cookies for tracking
- All image processing happens in the browser — **images NEVER leave the user's device**
- This is a core privacy promise of the platform

---

## 🛠️ TECH STACK

| Layer                | Technology                       | Notes                                                                        |
| -------------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| **Framework**        | Next.js 14+ (App Router)         | Static export (`output: 'export'`) — NO server components that need a server |
| **Language**         | TypeScript                       | Strict mode, proper types, no `any` unless absolutely necessary              |
| **Styling**          | Tailwind CSS 4                   | Utility-first, responsive design, clean and minimal                          |
| **UI Components**    | shadcn/ui                        | Consistent, accessible, customizable components                              |
| **Canvas/Image**     | Fabric.js / Konva.js             | For advanced canvas manipulation                                             |
| **Image Processing** | Sharp (WASM) / Squoosh (WASM)    | Browser-based image compression and conversion                               |
| **OCR**              | Tesseract.js                     | Client-side text extraction from images                                      |
| **AI Features**      | ONNX Runtime Web / TensorFlow.js | For AI-powered features like bg-remove, upscale                              |
| **PDF**              | pdf-lib / jsPDF                  | Client-side PDF generation and manipulation                                  |
| **Icons**            | Lucide React                     | Clean, consistent iconography                                                |
| **Animations**       | Framer Motion                    | Subtle, smooth animations — don't overdo it                                  |
| **Hosting**          | Vercel / Cloudflare Pages        | Free tier, edge deployment                                                   |
| **Package Manager**  | npm                              | Stable and widely supported                                                  |

### Important Tech Notes:

- **Static Export is MANDATORY** — the entire site must be exportable as static HTML/CSS/JS
- Use **dynamic imports** and **code splitting** aggressively — don't load a 5MB WASM module on the homepage
- Every tool page should **lazy load** its dependencies
- Use **Web Workers** for heavy processing to keep the UI responsive
- Prefer **WASM-based** solutions over pure JS for performance-critical operations

---

## 🎨 DESIGN SYSTEM & UI/UX GUIDELINES

### Core Design Philosophy

> **"Minimalism is not about removing things. It's about only having things that matter."**

- **Clean. Minimal. Fast. Functional.**
- No clutter, no unnecessary elements, no visual noise
- The tool should feel like a premium product even though it's free
- Inspiration: Linear, Vercel, Raycast — that kind of clean energy

### Color System

#### Light Mode ☀️

```
Background:        #FFFFFF (pure white)
Surface:           #F9FAFB (slight gray)
Border:            #E5E7EB (subtle borders)
Text Primary:      #111827 (near black)
Text Secondary:    #6B7280 (muted gray)
Accent/Primary:    #000000 (black) or a single brand color
Hover states:      #F3F4F6
```

#### Dark Mode 🌙

```
Background:        #09090B (near black)
Surface:           #18181B (dark zinc)
Border:            #27272A (subtle dark border)
Text Primary:      #FAFAFA (near white)
Text Secondary:    #A1A1AA (muted light gray)
Accent/Primary:    #FFFFFF (white) or same brand color
Hover states:      #27272A
```

### Typography

- **Font:** Inter or Geist Sans (clean, modern, great readability)
- **Headings:** Bold, clear hierarchy
- **Body:** Regular weight, comfortable line height (1.6)
- **Monospace (if needed):** Geist Mono or JetBrains Mono

### Layout Principles

- **Max content width:** 1200px centered
- **Generous whitespace** — let the design breathe
- **Consistent padding/margins** — use Tailwind's spacing scale (4, 6, 8, 12, 16, etc.)
- **Mobile-first** — every tool MUST work perfectly on mobile
- **Grid-based tool listing** on the homepage
- Each tool gets its **own dedicated page/route**

### Component Standards

- All buttons should have **hover and active states**
- Use **toast notifications** (sonner) for success/error feedback
- **Drag and drop** zone for image upload on every tool (with click fallback)
- Show **file size, dimensions, format** after image upload
- **Before/After preview** where applicable
- **Download button** always prominent and obvious
- **Progress indicators** for heavy processing tasks
- Smooth **page transitions** with Framer Motion (keep it subtle)

### Navigation

- **Top navbar:** Logo (left) + Tool search (center) + Theme toggle (right)
- **Homepage:** Hero section + Grid of all tools with icons and short descriptions
- **Tool pages:** Clean header + Upload zone + Tool controls + Preview + Download
- **Footer:** Minimal — GitHub link, "Made with ❤️", maybe a "Buy me a coffee" link

### Theme Toggle (Light/Dark Mode)

- **Default:** System preference (`prefers-color-scheme`)
- **Manual toggle** in navbar — persists via `localStorage`
- **Smooth transition** when switching (CSS transition on background/color)
- Use `next-themes` for implementation
- EVERY component must look good in BOTH modes — test this always

---

## 📁 PROJECT STRUCTURE

```
img0.xyz/
├── public/
│   ├── favicon.ico
│   ├── og-image.png              # OpenGraph image for social sharing
│   └── assets/                    # Static assets if any
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with theme provider
│   │   ├── page.tsx               # Homepage — tool grid
│   │   ├── globals.css            # Global styles + Tailwind
│   │   └── tools/
│   │       ├── bg-remove/
│   │       │   └── page.tsx
│   │       ├── bg-color/
│   │       │   └── page.tsx
│   │       ├── compress/
│   │       │   └── page.tsx
│   │       ├── resize/
│   │       │   └── page.tsx
│   │       ├── crop/
│   │       │   └── page.tsx
│   │       ├── convert/
│   │       │   └── page.tsx
│   │       ├── meme-generator/
│   │       │   └── page.tsx
│   │       ├── img-to-pdf/
│   │       │   └── page.tsx
│   │       ├── pdf-to-img/
│   │       │   └── page.tsx
│   │       ├── filters/
│   │       │   └── page.tsx
│   │       ├── watermark/
│   │       │   └── page.tsx
│   │       ├── color-picker/
│   │       │   └── page.tsx
│   │       ├── ocr/
│   │       │   └── page.tsx
│   │       ├── exif-viewer/
│   │       │   └── page.tsx
│   │       ├── collage/
│   │       │   └── page.tsx
│   │       ├── favicon-generator/
│   │       │   └── page.tsx
│   │       ├── social-resize/
│   │       │   └── page.tsx
│   │       ├── blur-censor/
│   │       │   └── page.tsx
│   │       ├── upscale/
│   │       │   └── page.tsx
│   │       ├── round-corners/
│   │       │   └── page.tsx
│   │       ├── flip-rotate/
│   │       │   └── page.tsx
│   │       ├── ascii-art/
│   │       │   └── page.tsx
│   │       ├── pixel-art/
│   │       │   └── page.tsx
│   │       ├── gif-maker/
│   │       │   └── page.tsx
│   │       ├── base64/
│   │       │   └── page.tsx
│   │       ├── compare/
│   │       │   └── page.tsx
│   │       ├── passport-photo/
│   │       │   └── page.tsx
│   │       ├── screenshot-beautifier/
│   │       │   └── page.tsx
│   │       └── batch-resize/
│   │           └── page.tsx
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── shared/
│   │   │   ├── ImageUploader.tsx   # Reusable drag-n-drop upload zone
│   │   │   ├── ImagePreview.tsx    # Before/after preview component
│   │   │   ├── DownloadButton.tsx  # Universal download button
│   │   │   ├── ToolCard.tsx        # Homepage tool grid card
│   │   │   ├── ProcessingLoader.tsx # Loading state during processing
│   │   │   └── SearchBar.tsx       # Tool search/filter
│   │   └── tools/                  # Tool-specific components if needed
│   ├── lib/
│   │   ├── utils.ts               # General utilities
│   │   ├── image-utils.ts         # Image processing helpers
│   │   ├── download.ts            # File download helpers
│   │   ├── constants.ts           # App-wide constants
│   │   └── tools-registry.ts     # Central registry of all tools (name, icon, route, description)
│   ├── hooks/
│   │   ├── useImageUpload.ts      # Custom hook for image upload logic
│   │   ├── useImageProcessor.ts   # Custom hook for processing state management
│   │   └── useWebWorker.ts        # Custom hook for web worker management
│   ├── workers/                   # Web Workers for heavy processing
│   │   ├── compress.worker.ts
│   │   ├── convert.worker.ts
│   │   └── ocr.worker.ts
│   └── types/
│       └── index.ts               # Shared TypeScript types
├── next.config.ts                 # Static export config
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── package-lock.json
├── .gitignore
├── .eslintrc.json
├── AGENTS.md                      # This file — you are here 📍
└── README.md
```

---

## 🔧 FEATURE LIST & BUILD ORDER

> **Build one tool at a time. Ship incrementally. Test each tool before moving to the next.**

### Phase 0: Foundation 🏗️

> Phase 0 foundation setup is complete.

- [x] Phase 0 completed and approved

### Phase 1: Core Image Tools 🖼️

> Phase 1 core image tools are complete.

- [x] Phase 1 completed and approved

1. **Image Compressor / Optimizer**
   - Compress images while maintaining quality
   - Show before/after file size comparison
   - Quality slider (1-100)
   - Support: JPG, PNG, WebP
   - Library: browser-image-compression or Squoosh WASM

2. **Image Resizer**
   - Resize by dimensions (width x height)
   - Resize by percentage
   - Lock/unlock aspect ratio toggle
   - Preset sizes (HD, 4K, social media sizes)
   - Batch resize support

3. **Image Cropper**
   - Freeform crop
   - Aspect ratio presets (1:1, 4:3, 16:9, 9:16, custom)
   - Drag handles for adjustment
   - Library: react-image-crop or react-easy-crop

4. **Format Converter**
   - Convert between: PNG ↔ JPG ↔ WebP ↔ AVIF ↔ BMP ↔ GIF ↔ ICO
   - Batch conversion support
   - Show format info and file size difference

5. **Flip & Rotate**
   - Rotate: 90°, 180°, 270°, custom angle
   - Flip: Horizontal, Vertical
   - Real-time preview

### Phase 2: Background & Color Tools 🎨

6. **Background Remover**
   - AI-powered background removal in browser
   - Library: @imgly/background-removal (runs in browser via WASM/ONNX)
   - Download as PNG with transparent background
   - Show processing progress

7. **Background Color Changer**
   - Remove background + replace with solid color
   - Color picker for custom color
   - Preset colors (white, black, common colors)
   - Gradient background option

8. **Image Color Changer / Filters**
   - Preset filters: Grayscale, Sepia, Vintage, Warm, Cool, High Contrast, etc.
   - Custom adjustments: Brightness, Contrast, Saturation, Hue, Exposure
   - Sliders for each adjustment
   - Real-time canvas preview
   - Reset to original button

9. **Color Picker / Palette Extractor**
   - Upload image → extract dominant colors
   - Click on any pixel to get its color
   - Show HEX, RGB, HSL values
   - Copy color codes with one click
   - Generate harmonious palette from image

### Phase 3: Text & Overlay Tools ✍️

10. **Meme Generator**
    - Upload image or choose from templates
    - Add top/bottom text (classic meme style)
    - Custom text positioning (drag anywhere)
    - Font selection, size, color, stroke
    - Library: Fabric.js or Konva.js for canvas

11. **Add Text / Watermark**
    - Add custom text overlay to image
    - Adjust: font, size, color, opacity, position, rotation
    - Image watermark option (upload a logo)
    - Tiled/repeated watermark pattern option
    - Drag to position

12. **Screenshot Beautifier**
    - Upload a screenshot
    - Add beautiful background gradient/solid/image
    - Add device mockup frame (browser, phone, tablet)
    - Padding, border radius, shadow controls
    - Export as PNG or copy to clipboard
    - Inspiration: Xnapper, Shottr, Carbon (for code)

### Phase 4: PDF & Document Tools 📄

13. **Image to PDF**
    - Upload multiple images
    - Arrange order via drag-and-drop
    - Page size options (A4, Letter, Custom)
    - Orientation (Portrait/Landscape)
    - Margin controls
    - Generate and download PDF
    - Library: jsPDF or pdf-lib

14. **PDF to Image**
    - Upload PDF
    - Convert each page to image (PNG/JPG)
    - Select specific pages or convert all
    - Quality/DPI settings
    - Download individual or as ZIP
    - Library: pdf.js (Mozilla)

15. **OCR — Extract Text from Image**
    - Upload image with text
    - Extract text using Tesseract.js
    - Language selection (English, Hindi, Arabic, etc.)
    - Copy extracted text to clipboard
    - Show confidence score
    - Support for multiple languages simultaneously

### Phase 5: Utility Tools 🔨

16. **EXIF Metadata Viewer & Remover**
    - Upload image → display all EXIF/metadata
    - Show: camera model, date, GPS location, settings, etc.
    - Option to REMOVE all metadata (privacy tool)
    - Download clean image without metadata
    - Library: exifr or piexifjs

17. **Image to Base64 Converter**
    - Upload image → get Base64 string
    - Also: paste Base64 → get image
    - Copy to clipboard button
    - Show data URI format for HTML embedding
    - Show string length/size

18. **Round Corners**
    - Upload image → apply rounded corners
    - Radius slider
    - Circle crop option
    - Transparent corners (PNG output)

19. **Blur / Censor Tool**
    - Upload image
    - Draw rectangles over areas to blur/pixelate
    - Adjustable blur intensity
    - Pixelation option
    - Use case: blurring faces, sensitive info, license plates

20. **Favicon / App Icon Generator**
    - Upload image
    - Generate all required sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 192x192, 512x512
    - Generate favicon.ico (multi-size)
    - Generate Apple Touch icons
    - Download as ZIP with all sizes
    - Generate manifest.json snippet

21. **Social Media Resizer**
    - Upload image
    - Preset sizes for platforms:
      - Instagram: Post (1080x1080), Story (1080x1920), Reel cover
      - Twitter/X: Post (1200x675), Header (1500x500)
      - LinkedIn: Post (1200x627), Banner (1584x396)
      - YouTube: Thumbnail (1280x720), Banner (2560x1440)
      - Facebook: Post (1200x630), Cover (820x312)
    - Smart crop with preview for each size
    - Batch download all sizes

22. **Passport / ID Photo Cropper**
    - Upload photo
    - Preset sizes for different countries (US, India, UK, Schengen, etc.)
    - Guidelines overlay showing face/head placement
    - Auto-crop suggestion
    - Print layout (multiple photos on one sheet)

### Phase 6: Creative & Fun Tools 🎉

23. **Image Collage Maker**
    - Upload multiple images
    - Grid layouts: 2x2, 3x3, 2x3, custom
    - Freeform collage option
    - Adjust spacing/gap between images
    - Background color behind collage
    - Library: Fabric.js or Konva.js

24. **GIF Maker**
    - Upload multiple images → create GIF
    - Frame delay/speed control
    - Loop settings
    - Resize output
    - Preview animation before download
    - Library: gif.js or gifenc

25. **ASCII Art Converter**
    - Upload image → convert to ASCII text art
    - Adjustable character density
    - Color ASCII option (HTML output)
    - Copy to clipboard
    - Dark/light character sets

26. **Pixel Art Converter**
    - Upload image → convert to pixel art style
    - Adjustable pixel size / block size
    - Color palette limiting (8-bit, 16-bit, custom)
    - Download as PNG

27. **Before/After Comparison Slider**
    - Upload two images (or use original vs edited)
    - Interactive slider to compare
    - Horizontal/vertical slider option
    - Embeddable component code output

### Phase 7: AI-Powered Tools 🤖

> These use client-side ML models. Heavier but powerful.

28. **AI Image Upscaler**
    - Upscale low-resolution images 2x or 4x
    - Library: ONNX Runtime Web with a lightweight super-resolution model
    - Show before/after comparison
    - Warning about processing time on low-end devices
    - Use Web Worker to prevent UI freeze

29. **AI Colorize B&W Photos**
    - Upload black & white image
    - Colorize using client-side model
    - Library: TensorFlow.js with a colorization model
    - Before/after preview

30. **AI Object Eraser (Stretch Goal)**
    - Select area of image to erase/inpaint
    - Client-side inpainting model
    - This is heavy — mark as experimental/beta
    - May need a lightweight model or simplified approach

### Phase 8: Batch Operations & Power Features ⚡

31. **Batch Image Processor**
    - Upload multiple images at once
    - Apply same operation to all: resize, compress, convert, etc.
    - Progress bar for batch processing
    - Download all as ZIP
    - Library: JSZip for ZIP creation

32. **Image Sprite Sheet Generator/Splitter**
    - Upload multiple images → generate sprite sheet
    - OR upload sprite sheet → split into individual images
    - Configurable rows/columns
    - CSS sprite code generation

---

## ⚙️ DEVELOPMENT GUIDELINES

### Code Quality Standards

- **TypeScript strict mode** — no `any` types unless there's genuinely no other way
- **ESLint + Prettier** — consistent formatting
- **Descriptive variable/function names** — code should be self-documenting
- **Comments** only for complex logic — don't comment obvious things
- **DRY principle** — if you're copying code, make it a shared component/hook/util
- **Error handling** — every tool should handle edge cases gracefully (wrong file type, too large, etc.)

### Component Architecture

- **Reuse shared components** (`ImageUploader`, `DownloadButton`, `ImagePreview`, etc.)
- **Each tool page** should follow the same pattern:
  ```
  Upload → Configure/Edit → Preview → Download
  ```
- Keep tool-specific logic in the tool's page or a dedicated hook
- Generic logic goes in `lib/` or `hooks/`

### Performance Rules

- **Lazy load** every tool page and its dependencies
- **Use Web Workers** for any operation that takes >100ms
- **Dynamic imports** for heavy libraries (WASM, ONNX, Tesseract, etc.)
- **Show progress** for any operation >500ms
- **Optimize images** used in the UI itself
- **Core Web Vitals matter** — LCP < 2.5s, FID < 100ms, CLS < 0.1
- Bundle size awareness — check with `next build` and analyze

### Accessibility

- **Proper aria labels** on interactive elements
- **Keyboard navigation** support
- **Focus management** for modals and dialogs
- **Alt text** for images
- **Color contrast** compliance (WCAG AA minimum)
- **Screen reader** friendly tool descriptions

### Error Handling & UX

- **File type validation** — show clear error if wrong type uploaded
- **File size limits** — warn before processing huge files
- **Graceful degradation** — if a WASM module fails to load, show helpful error
- **Toast notifications** (use sonner) for success/error states
- **Never lose user's work** — if processing fails, keep the original uploaded image
- **Clear "reset" or "start over" button** on every tool

---

## 🌐 SEO & META

Every page should have:

- Unique `<title>` — e.g., "Free Image Compressor — img0.xyz"
- Meta description — e.g., "Compress images for free in your browser. No signup, no upload to servers. 100% private."
- OpenGraph tags (title, description, image)
- Twitter card meta tags
- Structured data / JSON-LD where applicable
- Canonical URLs
- Sitemap.xml (auto-generate)
- robots.txt

### URL Structure

```
img0.xyz/                          → Homepage
img0.xyz/tools/compress            → Image Compressor
img0.xyz/tools/resize              → Image Resizer
img0.xyz/tools/bg-remove           → Background Remover
img0.xyz/tools/[tool-slug]         → Individual tool pages
```

---

## 🧪 TESTING APPROACH

- **Manual testing** for each tool after building (I'll do this)
- **Edge cases to always test:**
  - Very large files (10MB+)
  - Very small files (< 1KB)
  - Unsupported file formats
  - Corrupt/broken image files
  - Mobile browsers (iOS Safari, Chrome Android)
  - Slow network (though it shouldn't matter since it's client-side)
  - Multiple rapid operations
- **Browser compatibility:** Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Device testing:** Desktop, tablet, mobile

---

## 📦 DEPLOYMENT

### Static Export Config (next.config.ts)

```typescript
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true, // Required for static export
  },
  // No rewrites, no redirects that need a server
};
```

### Hosting Options (all free tier)

1. **Vercel** (primary) — auto-deploy from GitHub
2. **Cloudflare Pages** (backup/alternative) — great edge performance
3. **GitHub Pages** (fallback)

### Domain Setup

- Custom domain: img0.xyz
- SSL: Auto via hosting provider
- DNS: Configured to point to hosting

---

## 🗺️ ROADMAP SUMMARY

| Phase     | Focus              | Tools Count        |
| --------- | ------------------ | ------------------ |
| Phase 0   | Foundation & Setup | Completed ✅        |
| Phase 1   | Core Image Tools   | Completed ✅        |
| Phase 2   | Background & Color | 4 tools            |
| Phase 3   | Text & Overlay     | 3 tools            |
| Phase 4   | PDF & Document     | 3 tools            |
| Phase 5   | Utility Tools      | 7 tools            |
| Phase 6   | Creative & Fun     | 5 tools            |
| Phase 7   | AI-Powered         | 3 tools            |
| Phase 8   | Batch & Power      | 2 tools            |
| **Total** |                    | **32 tools**       |

---

## 💡 FUTURE IDEAS (Post-Launch)

> Don't build these now. Just keeping track.

- [ ] PWA support (installable app)
- [ ] Keyboard shortcuts for power users
- [ ] Tool history / recent tools (localStorage)
- [ ] URL sharing with pre-filled settings
- [ ] Plugin system for community tools
- [ ] i18n / multi-language support (Hindi, Arabic, etc.)
- [ ] Chrome extension version
- [ ] CLI tool (npm package) for developers
- [ ] Community submitted presets/templates
- [ ] Donation/sponsor page (Buy Me a Coffee, GitHub Sponsors)

---

## 📖 REFERENCE LIBRARIES

| Purpose               | Library                   | Link                                                        |
| --------------------- | ------------------------- | ----------------------------------------------------------- |
| Image compression     | browser-image-compression | https://github.com/nicolo-ribaudo/browser-image-compression |
| BG removal            | @imgly/background-removal | https://github.com/nicolo-ribaudo/browser-image-compression |
| Canvas manipulation   | Fabric.js                 | https://fabricjs.com                                        |
| Canvas (alternative)  | Konva.js                  | https://konvajs.org                                         |
| OCR                   | Tesseract.js              | https://tesseract.projectnaptha.com                         |
| PDF creation          | jsPDF                     | https://github.com/parallax/jsPDF                           |
| PDF parsing           | pdf.js                    | https://mozilla.github.io/pdf.js                            |
| PDF manipulation      | pdf-lib                   | https://pdf-lib.js.org                                      |
| Image crop            | react-easy-crop           | https://github.com/ValentinH/react-easy-crop                |
| GIF creation          | gif.js                    | https://jnordberg.github.io/gif.js                          |
| ZIP creation          | JSZip                     | https://stuk.github.io/jszip                                |
| EXIF reading          | exifr                     | https://github.com/nicolo-ribaudo/browser-image-compression |
| AI/ML runtime         | ONNX Runtime Web          | https://onnxruntime.ai                                      |
| AI/ML (alternative)   | TensorFlow.js             | https://www.tensorflow.org/js                               |
| WASM image processing | Squoosh (libsquoosh)      | https://github.com/nicolo-ribaudo/browser-image-compression |
| Theme management      | next-themes               | https://github.com/pacocoursey/next-themes                  |
| Toasts                | sonner                    | https://sonner.emilkowal.dev                                |
| Animations            | framer-motion             | https://www.framer.com/motion                               |

---

## 🤝 FINAL NOTES FOR THE AI AGENT

1. **Build one tool at a time.** Don't try to build everything in one go.
2. **Test each tool** before moving to the next. Tell me "Homie, test karle yeh 🧪" after each tool.
3. **Keep the codebase clean.** Refactor as you go. Don't let tech debt pile up.
4. **Ask me before making big decisions** — like changing the tech stack, project structure, or adding new dependencies.
5. **Keep bundle size in check.** Alert me if any dependency is >500KB.
6. **Remember: NO GIT COMMANDS without my permission.** I'll say it again. ⛔
7. **Vibe with me.** This is a passion project. Let's build something sick. 🔥

---

> **"img0.xyz — Because your images deserve better tools, and you deserve them for free."** 🚀

---

_Last updated: February 2025_
_Maintained by: Captain / Homie (that's you!) 🫡_
