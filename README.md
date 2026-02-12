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
- Circular Crop: [`/tools/circular-crop`](https://img0.xyz/tools/circular-crop)
- Rounded Corners: [`/tools/rounded-corners`](https://img0.xyz/tools/rounded-corners)
- Add Text Overlay: [`/tools/add-text-overlay`](https://img0.xyz/tools/add-text-overlay)
- Add Watermark: [`/tools/add-watermark`](https://img0.xyz/tools/add-watermark)
- Meme Generator: [`/tools/meme-generator`](https://img0.xyz/tools/meme-generator)
- Remove Watermark: [`/tools/remove-watermark`](https://img0.xyz/tools/remove-watermark)
- Adjust Brightness: [`/tools/adjust-brightness`](https://img0.xyz/tools/adjust-brightness)
- Adjust Contrast: [`/tools/adjust-contrast`](https://img0.xyz/tools/adjust-contrast)
- Adjust Saturation: [`/tools/adjust-saturation`](https://img0.xyz/tools/adjust-saturation)
- Hue Shifter: [`/tools/hue-shifter`](https://img0.xyz/tools/hue-shifter)
- Grayscale Converter: [`/tools/grayscale-converter`](https://img0.xyz/tools/grayscale-converter)
- Sepia Filter: [`/tools/sepia-filter`](https://img0.xyz/tools/sepia-filter)
- Invert Colors: [`/tools/invert-colors`](https://img0.xyz/tools/invert-colors)
- Color Replacement: [`/tools/color-replacement`](https://img0.xyz/tools/color-replacement)
- Auto Enhance: [`/tools/auto-enhance`](https://img0.xyz/tools/auto-enhance)
- Image Compressor: [`/tools/image-compressor`](https://img0.xyz/tools/image-compressor)
- Rotate & Flip: [`/tools/rotate-flip`](https://img0.xyz/tools/rotate-flip)
- Remove Background: [`/tools/remove-background`](https://img0.xyz/tools/remove-background)
- Change Background Color: [`/tools/change-background-color`](https://img0.xyz/tools/change-background-color)
- Blur Background: [`/tools/blur-background`](https://img0.xyz/tools/blur-background)
- Replace Background: [`/tools/replace-background`](https://img0.xyz/tools/replace-background)
- Format Converter: [`/tools/format-converter`](https://img0.xyz/tools/format-converter)
- QR Code Generator: [`/tools/qr-code-generator`](https://img0.xyz/tools/qr-code-generator)
- Image to PDF: [`/tools/image-to-pdf`](https://img0.xyz/tools/image-to-pdf)
- PDF to Image: [`/tools/pdf-to-image`](https://img0.xyz/tools/pdf-to-image)
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
<summary><strong>3) Image Compressor</strong> (<code>/tools/image-compressor</code>)</summary>

- Upload via click or drag/drop
- Output formats: `JPG`, `WebP`, `PNG`
- Quality slider for lossy formats
- Resolution scale slider (`10%` to `100%`)
- Compression result with saved-size stats

</details>

<details>
<summary><strong>4) Rotate & Flip</strong> (<code>/tools/rotate-flip</code>)</summary>

- Upload via click or drag/drop
- Rotation presets: `0°`, `90°`, `180°`, `270°`
- Flip options: `Horizontal`, `Vertical`
- Live preview before export
- Export formats: `PNG`, `JPG`, `WebP`

</details>

<details>
<summary><strong>5) QR Code Generator</strong> (<code>/tools/qr-code-generator</code>)</summary>

- Input text or URL
- Size + margin sliders
- Foreground/background color controls
- Transparent background option
- Error correction levels: `L`, `M`, `Q`, `H`
- Download formats: `PNG`, `JPG`

</details>

<details>
<summary><strong>6) Remove Background</strong> (<code>/tools/remove-background</code>)</summary>

- Upload image and run AI-based background removal
- Runs fully in browser (no backend uploads)
- Transparent result preview with checkerboard
- Download transparent output as `PNG`

</details>

<details>
<summary><strong>7) Change Background Color</strong> (<code>/tools/change-background-color</code>)</summary>

- Pick any solid background color
- No AI or background-removal step in this tool
- Two-stage preview: original and color-applied
- Download final image in `PNG`, `JPG`, or `WebP`

</details>

<details>
<summary><strong>8) Blur Background</strong> (<code>/tools/blur-background</code>)</summary>

- Keeps subject sharp while blurring background
- Adjustable blur strength slider
- Preview includes original, cutout, and final output
- Export in `JPG`, `PNG`, or `WebP`

</details>

<details>
<summary><strong>9) Image to PDF</strong> (<code>/tools/image-to-pdf</code>)</summary>

- Upload one or multiple images
- Reorder pages before export
- Auto fit inside page (no crop)
- Fixed A4 output
- Right-side PDF preview + download

</details>

<details>
<summary><strong>10) PDF to Image</strong> (<code>/tools/pdf-to-image</code>)</summary>

- Upload PDF and extract all pages
- Output formats: `PNG`, `JPG`, `WebP`
- Quality slider for lossy formats
- Render scale control for resolution
- Per-page download + download all

</details>

<details>
<summary><strong>11) Circular Crop</strong> (<code>/tools/circular-crop</code>)</summary>

- Upload via click or drag/drop
- Adjustable circle radius
- Horizontal and vertical position sliders
- Export in `PNG`, `JPG`, and `WebP`
- Transparent output support in `PNG` and `WebP`

</details>

<details>
<summary><strong>12) Rounded Corners</strong> (<code>/tools/rounded-corners</code>)</summary>

- Upload via click or drag/drop
- Adjustable corner roundness slider
- Live radius preview before export
- Export in `PNG`, `JPG`, and `WebP`
- Transparent corner support in `PNG` and `WebP`

</details>

<details>
<summary><strong>13) Add Text Overlay</strong> (<code>/tools/add-text-overlay</code>)</summary>

- Multi-line text input with auto-wrap support
- Font family, weight, size, and line-height controls
- Text color, opacity, and full shadow controls
- Horizontal + vertical alignment with X/Y offset sliders
- Export in `PNG`, `JPG`, and `WebP`

</details>

<details>
<summary><strong>14) Add Watermark</strong> (<code>/tools/add-watermark</code>)</summary>

- Add watermark as text or logo image
- Position presets with margin and X/Y offset
- Opacity and rotation controls
- Text styling: font family, weight, size, color, shadow
- Export in `PNG`, `JPG`, and `WebP`

</details>

<details>
<summary><strong>15) Meme Generator</strong> (<code>/tools/meme-generator</code>)</summary>

- Top and bottom meme caption inputs
- Classic meme text styling with stroke + shadow
- Font family, size, weight, line-height, and margin controls
- Independent top/bottom Y offset sliders
- Export in `PNG`, `JPG`, and `WebP`

</details>

<details>
<summary><strong>16) Remove Watermark</strong> (<code>/tools/remove-watermark</code>)</summary>

- Drag-select target area on image
- Fine control for area X/Y/width/height
- Patch source direction: auto, above, below, left, right
- Feather blur and multi-pass blending
- Export in `PNG`, `JPG`, and `WebP`

</details>

<details>
<summary><strong>17) Adjust Brightness</strong> (<code>/tools/adjust-brightness</code>)</summary>

- Brightness slider from `-100` to `+100`
- Real-time output generation on apply
- Export in `PNG`, `JPG`, and `WebP`

</details>

<details>
<summary><strong>18) Adjust Contrast</strong> (<code>/tools/adjust-contrast</code>)</summary>

- Contrast slider from `-100` to `+100`
- Original vs filtered preview
- Export in `PNG`, `JPG`, and `WebP`

</details>

<details>
<summary><strong>19) Adjust Saturation</strong> (<code>/tools/adjust-saturation</code>)</summary>

- Saturation slider from `-100` to `+100`
- Quickly mute or boost image colors
- Export in `PNG`, `JPG`, and `WebP`

</details>

<details>
<summary><strong>20) Hue Shifter</strong> (<code>/tools/hue-shifter</code>)</summary>

- Hue rotation slider from `-180°` to `+180°`
- Fast global color-tone shift
- Export in `PNG`, `JPG`, and `WebP`

</details>

<details>
<summary><strong>21) Grayscale Converter</strong> (<code>/tools/grayscale-converter</code>)</summary>

- One-click black-and-white conversion
- Clean side-by-side preview
- Export in `PNG`, `JPG`, and `WebP`

</details>

<details>
<summary><strong>22) Sepia Filter</strong> (<code>/tools/sepia-filter</code>)</summary>

- Instant warm vintage sepia effect
- Side-by-side preview
- Export in `PNG`, `JPG`, and `WebP`

</details>

<details>
<summary><strong>23) Invert Colors</strong> (<code>/tools/invert-colors</code>)</summary>

- One-click color inversion
- Negative-style visual output
- Export in `PNG`, `JPG`, and `WebP`

</details>

<details>
<summary><strong>24) Color Replacement</strong> (<code>/tools/color-replacement</code>)</summary>

- Pick source color and destination color
- Tolerance + softness controls
- Export in `PNG`, `JPG`, and `WebP`

</details>

<details>
<summary><strong>25) Auto Enhance</strong> (<code>/tools/auto-enhance</code>)</summary>

- One-click enhancement pipeline
- Adjustable enhance strength slider
- Balanced brightness/contrast/saturation boost

</details>

<details>
<summary><strong>26) Replace Background</strong> (<code>/tools/replace-background</code>)</summary>

- Upload source image and new background image
- Keeps subject in front using in-browser cutout
- Background fit modes: `cover`, `contain`, `stretch`
- Background scale and X/Y position controls
- Export in `JPG`, `PNG`, or `WebP`

</details>

## Tool Status Tracker

Below is the current roadmap used on the landing page.

<details>
<summary><strong>Core Image Manipulation (5/5 live)</strong></summary>

- [x] Crop Image
- [x] Resize Image
- [x] Rotate & Flip
- [x] Image Compressor
- [x] Format Converter

</details>

<details>
<summary><strong>Background Tools (4/4 live)</strong></summary>

- [x] Remove Background
- [x] Change Background Color
- [x] Blur Background
- [x] Replace Background

</details>

<details>
<summary><strong>Color & Filters (9/9 live)</strong></summary>

- [x] Adjust Brightness
- [x] Adjust Contrast
- [x] Adjust Saturation
- [x] Hue Shifter
- [x] Grayscale Converter
- [x] Sepia Filter
- [x] Invert Colors
- [x] Color Replacement
- [x] Auto Enhance

</details>

<details>
<summary><strong>Shapes & Overlays (6/6 live)</strong></summary>

- [x] Circular Crop
- [x] Rounded Corners
- [x] Add Text Overlay
- [x] Remove Watermark
- [x] Add Watermark
- [x] Meme Generator

</details>

<details>
<summary><strong>Advanced Tools (3/6 live)</strong></summary>

- [x] Image to PDF
- [x] PDF to Image
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
- `@imgly/background-removal`
- `qrcode`
- `jspdf`
- `pdfjs-dist`
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
    adjust-brightness/page.tsx
    adjust-contrast/page.tsx
    adjust-saturation/page.tsx
    auto-enhance/page.tsx
    color-replacement/page.tsx
    grayscale-converter/page.tsx
    hue-shifter/page.tsx
    invert-colors/page.tsx
    sepia-filter/page.tsx
    add-watermark/page.tsx
    add-text-overlay/page.tsx
    circular-crop/page.tsx
    meme-generator/page.tsx
    remove-watermark/page.tsx
    rounded-corners/page.tsx
    crop-image/page.tsx
    format-converter/page.tsx
    blur-background/page.tsx
    replace-background/page.tsx
    change-background-color/page.tsx
    image-compressor/page.tsx
    image-to-pdf/page.tsx
    pdf-to-image/page.tsx
    qr-code-generator/page.tsx
    remove-background/page.tsx
    rotate-flip/page.tsx

components/
  layout/
    LandingHeader.tsx
    LandingFooter.tsx
    LandingPageClient.tsx
    ThemeProvider.tsx
    ThemeToggle.tsx
  tools/
    ColorFilterTool.tsx
    AddWatermarkTool.tsx
    AddTextOverlayTool.tsx
    CircularCropTool.tsx
    MemeGeneratorTool.tsx
    RemoveWatermarkTool.tsx
    RoundedCornersTool.tsx
    CropImageTool.tsx
    FormatConverterTool.tsx
    BlurBackgroundTool.tsx
    ReplaceBackgroundTool.tsx
    ChangeBackgroundColorTool.tsx
    ImageCompressorTool.tsx
    ImageToPdfTool.tsx
    PdfToImageTool.tsx
    QRCodeGeneratorTool.tsx
    RemoveBackgroundTool.tsx
    RotateFlipTool.tsx
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
