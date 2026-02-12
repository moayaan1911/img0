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
        route: "/tools/crop-image",
      },
      {
        name: "Resize Image",
        description: "Resize by width and height with aspect lock.",
        route: "/tools/resize-image",
      },
      {
        name: "Rotate & Flip",
        description: "Rotate 90, 180, 270 and flip horizontally or vertically.",
        route: "/tools/rotate-flip",
      },
      {
        name: "Image Compressor",
        description: "Control output quality for JPEG, PNG, and WebP.",
        route: "/tools/image-compressor",
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
        route: "/tools/remove-background",
      },
      {
        name: "Change Background Color",
        description: "Replace transparent areas with solid colors.",
        route: "/tools/change-background-color",
      },
      {
        name: "Blur Background",
        description: "Selective portrait background blur effect.",
        route: "/tools/blur-background",
      },
      {
        name: "Replace Background",
        description: "Swap the background with another image.",
        route: "/tools/replace-background",
      },
    ],
  },
  {
    title: "Color & Filters",
    tools: [
      {
        name: "Adjust Brightness",
        description: "Fine-tune overall image brightness.",
        route: "/tools/adjust-brightness",
      },
      {
        name: "Adjust Contrast",
        description: "Increase or reduce contrast with a slider.",
        route: "/tools/adjust-contrast",
      },
      {
        name: "Adjust Saturation",
        description: "Control color intensity for vivid or muted output.",
        route: "/tools/adjust-saturation",
      },
      {
        name: "Hue Shifter",
        description: "Shift global color tone with hue control.",
        route: "/tools/hue-shifter",
      },
      {
        name: "Grayscale Converter",
        description: "Convert color images to black and white instantly.",
        route: "/tools/grayscale-converter",
      },
      {
        name: "Sepia Filter",
        description: "Apply a classic warm vintage look.",
        route: "/tools/sepia-filter",
      },
      {
        name: "Invert Colors",
        description: "Create negative-style image outputs.",
        route: "/tools/invert-colors",
      },
      {
        name: "Color Replacement",
        description: "Select one color and replace it with another.",
        route: "/tools/color-replacement",
      },
      {
        name: "Auto Enhance",
        description: "One-click improvements for tone and clarity.",
        route: "/tools/auto-enhance",
      },
    ],
  },
  {
    title: "Shapes & Overlays",
    tools: [
      {
        name: "Circular Crop",
        description: "Perfect circle crop with adjustable radius.",
        route: "/tools/circular-crop",
      },
      {
        name: "Rounded Corners",
        description: "Apply smooth rounded corners with radius control.",
        route: "/tools/rounded-corners",
      },
      {
        name: "Add Text Overlay",
        description: "Place custom text with font, size, and styling options.",
        route: "/tools/add-text-overlay",
      },
      {
        name: "Remove Watermark",
        description: "Clean watermark areas using patch and blend controls.",
        route: "/tools/remove-watermark",
      },
      {
        name: "Add Watermark",
        description: "Add text or logo watermark with opacity control.",
        route: "/tools/add-watermark",
      },
      {
        name: "Meme Generator",
        description: "Create memes with top and bottom caption styles.",
        route: "/tools/meme-generator",
      },
    ],
  },
  {
    title: "Advanced Tools",
    tools: [
      {
        name: "Image to PDF",
        description: "Export single or multiple images into PDF.",
        route: "/tools/image-to-pdf",
      },
      {
        name: "PDF to Image",
        description: "Extract image pages from PDF files.",
        route: "/tools/pdf-to-image",
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
