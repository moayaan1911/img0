# 👨‍💻 About the Developer

<p align="center">
  <img src="https://gateway.lighthouse.storage/ipfs/bafybeidlpfu7vy2rgevvo2msiebtvjfjtejlgjsgjja4jixly45sq3woii/profile.jpeg" alt="Mohammad Ayaan Siddiqui" width="200" />
</p>

Assalamualaikum guys! 🙌 This is Mohammad Ayaan Siddiqui (♦moayaan.eth♦). I’m a **Full Stack Blockchain Developer** , **Crypto Investor** and **MBA in Blockchain Management** with **2 years of experience** rocking the Web3 world! 🚀 I’ve worn many hats:

- Research Intern at a Hong Kong-based firm 🇭🇰
- Founding Engineer at a Netherlands-based firm 🇳🇱
- Full Stack Intern at a Singapore-based crypto hardware wallet firm 🇸🇬
- Blockchain Developer at a US-based Bitcoin DeFi project 🇺🇸
- PG Diploma in Blockchain Management from Cambridge International Qualifications (CIQ) 🇬🇧
- MBA in Blockchain Management from University of Studies Guglielmo Marconi, Italy 🇮🇹

Let’s connect and build something epic! Find me at [moayaan.com](https://moayaan.com) 🌐

If you liked this project, please donate to Gaza 🇵🇸 [UNRWA Donation Link](https://donate.unrwa.org/-landing-page/en_EN)

Happy coding, fam! 😎✨

---

# img0.xyz

Minimalist Image Studio in your browser.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6)
![Client-side](https://img.shields.io/badge/Processing-Client--Side-0ea5e9)
![No Signup](https://img.shields.io/badge/Auth-None-22c55e)
![Open Source](https://img.shields.io/badge/Open%20Source-Yes-8b5cf6)

img0.xyz is a privacy-first image toolkit focused on fast, clean, browser-based workflows. It is non-profit, open-source, and community-driven.

## Quick Links

- Live website: [img0.xyz](https://img0.xyz)
- Home: [`/`](https://img0.xyz/)
- Crop Image: [`/tools/crop-image`](https://img0.xyz/tools/crop-image)
- Format Converter: [`/tools/format-converter`](https://img0.xyz/tools/format-converter)
- QR Code Generator: [`/tools/qr-code-generator`](https://img0.xyz/tools/qr-code-generator)
- Contributing guide: [`CONTRIBUTION.md`](./CONTRIBUTION.md)

## Table of Contents

- [What Is Live Right Now](#what-is-live-right-now)
- [Tool Status Tracker](#tool-status-tracker)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [NPM Scripts](#npm-scripts)
- [Product Constraints](#product-constraints)
- [SEO and Discovery](#seo-and-discovery)
- [Contributing](#contributing)
- [License](#license)

## What Is Live Right Now

### Landing Experience

- Minimal landing with grouped tool cards
- Tool search bar in navbar (filters cards instantly)
- Light/Dark mode toggle (persists via `next-themes`)
- External quick links: website, donate, GitHub

### Implemented Tools

<details>
<summary><strong>1) Crop Image</strong> (<code>/tools/crop-image</code>)</summary>

- Upload via click or drag/drop
- Free crop + aspect presets: `1:1`, `4:3`, `16:9`, `9:16`
- Preset crop box can be moved around image before exporting
- Export formats: `PNG`, `JPG`, `WebP`
- Quality slider for lossy outputs
- Output preview + downloadable file

</details>

<details>
<summary><strong>2) Format Converter</strong> (<code>/tools/format-converter</code>)</summary>

- Upload via click or drag/drop
- Convert to: `PNG`, `JPG`, `WebP`, `ICO (favicon)`
- ICO size options: `16`, `32`, `48`, `64`, `128`, `256`
- Quality control for lossy output formats
- Output preview + downloadable file

</details>

<details>
<summary><strong>3) QR Code Generator</strong> (<code>/tools/qr-code-generator</code>)</summary>

- Input text or URL
- Size + margin sliders
- Foreground/background color controls
- Transparent background option
- Error correction levels: `L`, `M`, `Q`, `H`
- Download formats: `PNG`, `JPG`

</details>

## Tool Status Tracker

Below is the current 32-tool roadmap used on the landing page.

<details>
<summary><strong>Core Image Manipulation (2/5 live)</strong></summary>

- [x] Crop Image
- [ ] Resize Image
- [ ] Rotate & Flip
- [ ] Image Compressor
- [x] Format Converter

</details>

<details>
<summary><strong>Background Tools (0/4 live)</strong></summary>

- [ ] Remove Background
- [ ] Change Background Color
- [ ] Blur Background
- [ ] Replace Background

</details>

<details>
<summary><strong>Color & Filters (0/9 live)</strong></summary>

- [ ] Adjust Brightness
- [ ] Adjust Contrast
- [ ] Adjust Saturation
- [ ] Hue Shifter
- [ ] Grayscale Converter
- [ ] Sepia Filter
- [ ] Invert Colors
- [ ] Color Replacement
- [ ] Auto Enhance

</details>

<details>
<summary><strong>Shapes & Overlays (0/6 live)</strong></summary>

- [ ] Circular Crop
- [ ] Rounded Corners
- [ ] Add Text Overlay
- [ ] Add Shapes
- [ ] Add Watermark
- [ ] Meme Generator

</details>

<details>
<summary><strong>Advanced Tools (1/8 live)</strong></summary>

- [ ] Image to PDF
- [ ] PDF to Image
- [ ] Batch Processing
- [ ] Image Comparison Slider
- [x] QR Code Generator
- [ ] Barcode Reader
- [ ] Histogram View
- [ ] Noise Reduction

</details>

## Tech Stack

- Next.js (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- `next-themes`
- `qrcode`
- Pure browser-side image processing (Canvas APIs)

## Project Structure

```text
app/
  layout.tsx
  page.tsx
  globals.css
  robots.ts
  sitemap.ts
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

## Local Setup

```bash
npm install
npm run lint
npm run build
npm run dev
```

Open: `http://localhost:3000`

## NPM Scripts

- `npm run dev` - start development server
- `npm run lint` - run ESLint
- `npm run build` - create production build
- `npm run start` - run production server

## Product Constraints

- No login/signup
- No paid API lock-in
- Client-side processing first
- No third-party image upload requirement
- Keep UI minimal and fast

## SEO and Discovery

- Central metadata + JSON-LD in `app/layout.tsx`
- Dynamic sitemap in `app/sitemap.ts`
- Robots configuration in `app/robots.ts`

## Contributing

Contributions are welcome. Start with:

1. Read [`CONTRIBUTION.md`](./CONTRIBUTION.md)
2. Pick an unshipped tool from the tracker above
3. Ship small, testable increments

## License

No license file is committed yet. Add a license before wide redistribution.
