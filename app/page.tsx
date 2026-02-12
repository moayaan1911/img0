import type { Metadata } from "next";
import LandingPageClient from "@/components/layout/LandingPageClient";

type ToolItem = {
  name: string;
  description: string;
  route?: string;
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
        route: "/tools/format-converter",
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
        route: "/tools/qr-code-generator",
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
];

export default function HomePage() {
  return (
    <LandingPageClient
      toolSections={toolSections}
      trustPills={trustPills}
    />
  );
}
