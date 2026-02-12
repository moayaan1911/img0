# Contributing to img0.xyz

Thanks for contributing.

img0.xyz is a privacy-first image toolkit where processing should stay in the browser and UX should stay minimal, fast, and reliable.

## Quick Start

```bash
npm install
npm run lint
npm run build
npm run dev
```

App URL: `http://localhost:3000`

## Current Project Layout

```text
app/
  page.tsx
  layout.tsx
  globals.css
  sitemap.ts
  robots.ts
  tools/
    crop-image/page.tsx
    format-converter/page.tsx
    qr-code-generator/page.tsx

components/
  layout/
    LandingHeader.tsx
    LandingFooter.tsx
    LandingPageClient.tsx
    ThemeProvider.tsx
    ThemeToggle.tsx
  tools/
    CropImageTool.tsx
    FormatConverterTool.tsx
    QRCodeGeneratorTool.tsx
```

## What You Can Contribute

- New image tools from the roadmap
- Bug fixes
- Performance improvements
- Accessibility improvements
- Mobile UX polish
- Documentation improvements

## Non-Negotiables

- Keep processing client-side
- No auth/signup/paywall features
- No paid dependency lock-in
- No third-party image upload requirement
- No tracking-heavy integrations

## Tool Development Workflow

1. Create a new tool component in `components/tools/`  
   Example: `components/tools/ResizeImageTool.tsx`
2. Add a route page in `app/tools/<tool-slug>/page.tsx`
3. Add tool card metadata in `app/page.tsx` under `toolSections`
4. Add sitemap entry in `app/sitemap.ts`
5. Add page metadata (`title`, `description`) in the tool route
6. Update docs (`README.md`, this file) when behavior changes

## Tool UI Contract

For consistency, match existing tool pages:

- Header with tool label + `Back to Home` button
- Intro hero block with title + one-line description
- Main tool area (usually two columns on desktop)
- Clear empty/loading/error states
- Preview + download flow always visible after processing
- `cursor-pointer` on clickable controls

## Code Quality Expectations

- TypeScript-first, readable naming
- Keep components modular and focused
- Validate input files and unsupported states
- Show clear errors instead of silent failures
- Keep output naming predictable

## PR Checklist

- [ ] Feature works in light and dark mode
- [ ] Works on mobile (at least ~375px width)
- [ ] No runtime console errors
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Docs updated (if user-facing behavior changed)

## Bug Report Template

When reporting bugs, include:

- Tool name + route
- Browser + OS
- Steps to reproduce
- Expected vs actual behavior
- Screenshot or short recording

## Feature Request Template

When requesting a tool, include:

- Problem/use-case
- Input and output format expectations
- Single-file or batch usage
- Browser-side implementation idea (if known)

## Repository

- GitHub: [https://github.com/moayaan1911/img0](https://github.com/moayaan1911/img0)
