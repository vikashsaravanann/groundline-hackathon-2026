import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Groundline",
    short_name: "Groundline",
    description: "Human-guided vision-to-action AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FFFFFF",
    icons: [
      {
        src: "/brand/groundline-symbol-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/groundline-symbol-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/brand/groundline-symbol-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
