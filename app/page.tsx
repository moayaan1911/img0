import type { Metadata } from "next";
import LandingFooter from "@/components/layout/LandingFooter";
import LandingHeader from "@/components/layout/LandingHeader";

type ToolItem = {
  name: string;
  description: string;
};

type ToolSection = {
  title: string;
  tools: ToolItem[];
};

export const metadata: Metadata = {
  title: "img0.xyz",
  description: "Minimalist Image Studio in your browser",
};

const toolSections: ToolSection[] = [
  {
    title: "Core Image Manipulation",
    tools: [
      {
        name: "Crop Image",
        description: "Freeform crop with aspect ratio presets.",
      },
      {
        name: "Resize Image",
        description: "Resize by width and height with aspect lock.",
      },
      {
        name: "Rotate & Flip",
        description: "Rotate 90, 180, 270 and flip horizontally or vertically.",
      },
      {
        name: "Image Compressor",
        description: "Control output quality for JPEG, PNG, and WebP.",
      },
      {
        name: "Format Converter",
        description: "Convert between JPEG, PNG, WebP, AVIF, BMP, and GIF.",
      },
    ],
  },
  {
    title: "Background Tools",
    tools: [
      {
        name: "Remove Background",
        description: "AI-powered background removal in the browser.",
      },
      {
        name: "Change Background Color",
        description: "Replace transparent areas with solid colors.",
      },
      {
        name: "Blur Background",
        description: "Selective portrait background blur effect.",
      },
      {
        name: "Replace Background",
        description: "Swap the background with another image.",
      },
    ],
  },
  {
    title: "Color & Filters",
    tools: [
      {
        name: "Adjust Brightness",
        description: "Fine-tune overall image brightness.",
      },
      {
        name: "Adjust Contrast",
        description: "Increase or reduce contrast with a slider.",
      },
      {
        name: "Adjust Saturation",
        description: "Control color intensity for vivid or muted output.",
      },
      {
        name: "Hue Shifter",
        description: "Shift global color tone with hue control.",
      },
      {
        name: "Grayscale Converter",
        description: "Convert color images to black and white instantly.",
      },
      {
        name: "Sepia Filter",
        description: "Apply a classic warm vintage look.",
      },
      {
        name: "Invert Colors",
        description: "Create negative-style image outputs.",
      },
      {
        name: "Color Replacement",
        description: "Select one color and replace it with another.",
      },
      {
        name: "Auto Enhance",
        description: "One-click improvements for tone and clarity.",
      },
    ],
  },
  {
    title: "Shapes & Overlays",
    tools: [
      {
        name: "Circular Crop",
        description: "Perfect circle crop with adjustable radius.",
      },
      {
        name: "Rounded Corners",
        description: "Apply smooth rounded corners with radius control.",
      },
      {
        name: "Add Text Overlay",
        description: "Place custom text with font, size, and styling options.",
      },
      {
        name: "Add Shapes",
        description: "Overlay rectangles, circles, arrows, and lines.",
      },
      {
        name: "Add Watermark",
        description: "Add text or logo watermark with opacity control.",
      },
      {
        name: "Meme Generator",
        description: "Create memes with top and bottom caption styles.",
      },
    ],
  },
  {
    title: "Advanced Tools",
    tools: [
      {
        name: "Image to PDF",
        description: "Export single or multiple images into PDF.",
      },
      {
        name: "PDF to Image",
        description: "Extract image pages from PDF files.",
      },
      {
        name: "Batch Processing",
        description: "Apply the same operation to multiple images at once.",
      },
      {
        name: "Image Comparison Slider",
        description: "Before and after comparison with an interactive slider.",
      },
      {
        name: "QR Code Generator",
        description: "Generate QR codes from text or links.",
      },
      {
        name: "Barcode Reader",
        description: "Scan and decode barcodes from images.",
      },
      {
        name: "Histogram View",
        description: "Visualize RGB distribution for image analysis.",
      },
      {
        name: "Noise Reduction",
        description: "Reduce visual grain for cleaner image output.",
      },
    ],
  },
];

const trustPills = [
  "No Sign Up",
  "No Credit Card",
  "No Clutter",
  "Open Source",
] as const;

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-[-260px] -z-10 h-[560px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--text-primary)_13%,transparent)_0%,transparent_76%)]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-14 pt-4 sm:px-6 lg:px-8">
        <LandingHeader />

        <main className="space-y-12">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center sm:px-10">
            <p className="text-xs font-medium tracking-wide text-[var(--text-secondary)]">
              img0.xyz
            </p>
            <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Minimalist Image Studio in your browser.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
              Edit, optimize, and export images directly in your browser with a
              clean, distraction-free interface.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {trustPills.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-10">
            {toolSections.map((section) => (
              <div
                key={section.title}
                className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {section.title}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {section.tools.map((tool) => (
                    <article
                      key={tool.name}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <h3 className="text-sm font-semibold tracking-tight sm:text-base">
                        {tool.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {tool.description}
                      </p>
                      <button
                        type="button"
                        disabled
                        className="mt-4 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">
                        Coming Soon
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </main>

        <LandingFooter />
      </div>
    </div>
  );
}
