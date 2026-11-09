import type { MetadataRoute } from "next";

/**
 * Web app manifest: makes ETEN installable to the home screen as its own app
 * ("ETEN by Expervia"). One app covers the member area and Mentorship, which
 * share this address. It opens on /launch, which sends each person to their
 * own home. Icons come from scripts/generate-app-icons.mjs.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/launch",
    name: "ETEN by Expervia",
    short_name: "ETEN",
    description:
      "The Expervia Technology Experts Network: your pods, mentorship and opportunities in one place.",
    start_url: "/launch?source=app",
    scope: "/",
    display: "standalone",
    background_color: "#f7f6fb",
    theme_color: "#4a16c4",
    categories: ["business", "education", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/monochrome-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "monochrome",
      },
    ],
  };
}
