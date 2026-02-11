export type ToolStatus = "coming-soon" | "live";

export type ToolCategory =
  | "Core Image"
  | "Background & Color"
  | "Text & Overlay"
  | "PDF & Document"
  | "Utility"
  | "Creative"
  | "AI"
  | "Batch & Power";

export type ToolDefinition = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  phase: number;
  status: ToolStatus;
  route: string;
};

type ToolSeed = Omit<ToolDefinition, "status" | "route">;

const toolSeeds: ToolSeed[] = [
  {
    slug: "compress",
    name: "Image Compressor",
    description: "Compress JPG, PNG, and WebP with quality control.",
    category: "Core Image",
    phase: 1,
  },
  {
    slug: "resize",
    name: "Image Resizer",
    description: "Resize by pixel size, percentage, or platform presets.",
    category: "Core Image",
    phase: 1,
  },
  {
    slug: "crop",
    name: "Image Cropper",
    description: "Crop with freeform and locked aspect-ratio presets.",
    category: "Core Image",
    phase: 1,
  },
  {
    slug: "convert",
    name: "Format Converter",
    description: "Convert between PNG, JPG, WebP, AVIF, BMP, GIF, and ICO.",
    category: "Core Image",
    phase: 1,
  },
  {
    slug: "flip-rotate",
    name: "Flip & Rotate",
    description: "Rotate by fixed/custom angles and flip horizontally/vertically.",
    category: "Core Image",
    phase: 1,
  },
  {
    slug: "bg-remove",
    name: "Background Remover",
    description: "AI cutout for transparent PNG background removal.",
    category: "Background & Color",
    phase: 2,
  },
  {
    slug: "bg-color",
    name: "Background Color Changer",
    description: "Replace backgrounds with solid colors or gradients.",
    category: "Background & Color",
    phase: 2,
  },
  {
    slug: "filters",
    name: "Image Filters",
    description: "Apply preset filters and tune color adjustments with sliders.",
    category: "Background & Color",
    phase: 2,
  },
  {
    slug: "color-picker",
    name: "Color Picker",
    description: "Sample pixels and extract dominant color palettes.",
    category: "Background & Color",
    phase: 2,
  },
  {
    slug: "meme-generator",
    name: "Meme Generator",
    description: "Add text overlays and generate classic/custom memes.",
    category: "Text & Overlay",
    phase: 3,
  },
  {
    slug: "watermark",
    name: "Text & Watermark",
    description: "Place text or logo watermarks with full position control.",
    category: "Text & Overlay",
    phase: 3,
  },
  {
    slug: "screenshot-beautifier",
    name: "Screenshot Beautifier",
    description: "Wrap screenshots with gradients, padding, and mockup frames.",
    category: "Text & Overlay",
    phase: 3,
  },
  {
    slug: "img-to-pdf",
    name: "Image to PDF",
    description: "Merge ordered images into downloadable PDFs.",
    category: "PDF & Document",
    phase: 4,
  },
  {
    slug: "pdf-to-img",
    name: "PDF to Image",
    description: "Convert PDF pages into PNG or JPG outputs.",
    category: "PDF & Document",
    phase: 4,
  },
  {
    slug: "ocr",
    name: "OCR Text Extractor",
    description: "Extract text from image files using client-side OCR.",
    category: "PDF & Document",
    phase: 4,
  },
  {
    slug: "exif-viewer",
    name: "EXIF Viewer & Remover",
    description: "Inspect metadata and remove sensitive EXIF info.",
    category: "Utility",
    phase: 5,
  },
  {
    slug: "base64",
    name: "Image ↔ Base64",
    description: "Convert images to Base64 and decode Base64 back to images.",
    category: "Utility",
    phase: 5,
  },
  {
    slug: "round-corners",
    name: "Round Corners",
    description: "Apply rounded corners or circle crop with PNG output.",
    category: "Utility",
    phase: 5,
  },
  {
    slug: "blur-censor",
    name: "Blur / Censor Tool",
    description: "Blur or pixelate selected regions for privacy masking.",
    category: "Utility",
    phase: 5,
  },
  {
    slug: "favicon-generator",
    name: "Favicon Generator",
    description: "Generate favicon/app icon packs in standard sizes.",
    category: "Utility",
    phase: 5,
  },
  {
    slug: "social-resize",
    name: "Social Media Resizer",
    description: "Auto-size outputs for Instagram, X, LinkedIn, and YouTube.",
    category: "Utility",
    phase: 5,
  },
  {
    slug: "passport-photo",
    name: "Passport Photo Cropper",
    description: "Country-based passport and ID format presets.",
    category: "Utility",
    phase: 5,
  },
  {
    slug: "collage",
    name: "Collage Maker",
    description: "Build grid and freeform photo collages quickly.",
    category: "Creative",
    phase: 6,
  },
  {
    slug: "gif-maker",
    name: "GIF Maker",
    description: "Turn image sequences into optimized animated GIFs.",
    category: "Creative",
    phase: 6,
  },
  {
    slug: "ascii-art",
    name: "ASCII Art Converter",
    description: "Convert images into character-based ASCII artwork.",
    category: "Creative",
    phase: 6,
  },
  {
    slug: "pixel-art",
    name: "Pixel Art Converter",
    description: "Apply pixelation styles and limited color palettes.",
    category: "Creative",
    phase: 6,
  },
  {
    slug: "compare",
    name: "Before/After Compare",
    description: "Interactive slider for visual comparison of two images.",
    category: "Creative",
    phase: 6,
  },
  {
    slug: "upscale",
    name: "AI Image Upscaler",
    description: "2x and 4x super-resolution for low-resolution images.",
    category: "AI",
    phase: 7,
  },
  {
    slug: "colorize",
    name: "AI Colorize B&W",
    description: "Colorize black-and-white photos using browser ML models.",
    category: "AI",
    phase: 7,
  },
  {
    slug: "object-eraser",
    name: "AI Object Eraser",
    description: "Experimental area erase and inpaint style cleanup.",
    category: "AI",
    phase: 7,
  },
  {
    slug: "batch-resize",
    name: "Batch Image Processor",
    description: "Apply one operation to many files and export ZIP.",
    category: "Batch & Power",
    phase: 8,
  },
  {
    slug: "sprite-sheet",
    name: "Sprite Sheet Generator",
    description: "Create sprite sheets or split existing sheets.",
    category: "Batch & Power",
    phase: 8,
  },
];

const LIVE_TOOL_SLUGS = new Set([
  "compress",
  "resize",
  "crop",
  "convert",
  "flip-rotate",
  "bg-remove",
  "bg-color",
  "filters",
  "color-picker",
  "meme-generator",
  "watermark",
  "screenshot-beautifier",
  "img-to-pdf",
  "pdf-to-img",
  "ocr",
  "exif-viewer",
  "base64",
  "round-corners",
  "blur-censor",
  "favicon-generator",
  "social-resize",
  "passport-photo",
  "collage",
  "gif-maker",
  "ascii-art",
  "pixel-art",
  "compare",
  "upscale",
  "colorize",
  "object-eraser",
  "batch-resize",
  "sprite-sheet",
]);

export const TOOLS_REGISTRY: ToolDefinition[] = toolSeeds.map((tool) => ({
  ...tool,
  status: LIVE_TOOL_SLUGS.has(tool.slug) ? "live" : "coming-soon",
  route: `/tools/${tool.slug}`,
}));

export const FEATURED_TOOL_SLUGS = [
  "compress",
  "resize",
  "convert",
  "bg-remove",
  "bg-color",
  "filters",
  "color-picker",
  "meme-generator",
  "screenshot-beautifier",
  "img-to-pdf",
  "ocr",
  "watermark",
  "social-resize",
  "passport-photo",
  "gif-maker",
  "batch-resize",
  "sprite-sheet",
];

export const FEATURED_TOOLS = TOOLS_REGISTRY.filter((tool) =>
  FEATURED_TOOL_SLUGS.includes(tool.slug),
);

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS_REGISTRY.find((tool) => tool.slug === slug);
}
