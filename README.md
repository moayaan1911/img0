# img0.xyz

Minimalist Image Studio in your browser.

img0.xyz is a privacy-first image toolkit focused on fast, clean, browser-based workflows. The project is non-profit, open-source, and community-driven.

## Core Principles

- No paid APIs
- No user accounts
- No user image upload to third-party servers
- Keep tools simple, fast, and practical
- Open collaboration with contributors

## Tech Stack

- Next.js (App Router)
- TypeScript (strict)
- Tailwind CSS
- next-themes
- Client-side processing libraries (JS/WASM based)

## Current Status

- Phases shipped: 0 to 8
- Tools shipped: 33
- Tool categories: 8

## Tool Categories

### Core Image

- Image Compressor
- Image Resizer
- Image Cropper
- Format Converter
- Flip & Rotate

### Background & Color

- Background Remover
- Background Color Changer
- Image Filters
- Color Picker

### Text & Overlay

- Meme Generator
- Text & Watermark
- Screenshot Beautifier

### PDF & Document

- Image to PDF
- PDF to Image
- OCR Text Extractor

### Utility

- EXIF Viewer & Remover
- Image ↔ Base64
- Round Corners
- Circular Image Crop
- Blur / Censor Tool
- Favicon Generator
- Social Media Resizer
- Passport Photo Cropper

### Creative

- Collage Maker
- GIF Maker
- ASCII Art Converter
- Pixel Art Converter
- Before/After Compare

### AI

- AI Image Upscaler
- AI Colorize B&W
- AI Object Eraser

### Batch & Power

- Batch Image Processor
- Sprite Sheet Generator

## Project Structure

```text
app/
  page.tsx
  tools/
    page.tsx
    [slug]/page.tsx
    ...tool routes
src/
  components/
    layout/
    shared/
    tools/
  lib/
    image-utils.ts
    tools-registry.ts
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Run lint:

```bash
npm run lint
```

3. Build production bundle:

```bash
npm run build
```

4. (Optional) Run locally:

```bash
npm run dev
```

## Scripts

- `npm run dev` - start development server
- `npm run lint` - run ESLint
- `npm run build` - create production build
- `npm run start` - run production server

## Contributing

This project is designed to grow through community contributions.

Please read:

- [`CONTRIBUTION.md`](./CONTRIBUTION.md) for the full contribution workflow
- Existing tool pages and `src/lib/tools-registry.ts` before adding new tools

If you use the app and want to help, pick one:

- Add a new tool
- Improve performance/accessibility
- Fix edge-case bugs
- Improve docs and onboarding

## Contribution-Friendly Areas

- New image utilities (browser-only)
- Better UX states (error/progress/empty)
- Accessibility improvements
- Mobile responsiveness improvements
- Metadata/SEO improvements

## Non-Negotiables

- Keep the project free and open-source
- Keep processing client-side where feasible
- Do not introduce paid dependencies
- Do not introduce auth/account systems
- Do not introduce tracking-heavy analytics

## License

No explicit license file is present yet. Add a license before wider public distribution.
