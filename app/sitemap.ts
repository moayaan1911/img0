import type { MetadataRoute } from "next";
import { TOOLS_REGISTRY } from "@/src/lib/tools-registry";

const BASE_URL = "https://img0.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["/", "/tools"];
  const toolRoutes = TOOLS_REGISTRY.map((tool) => tool.route);

  return [...staticRoutes, ...toolRoutes].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
