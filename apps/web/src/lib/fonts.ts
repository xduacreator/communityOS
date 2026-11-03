import localFont from "next/font/local";

// Display font for the public site (landing page, blog and club pages).
// Outfit (SIL Open Font License 1.1) is bundled so builds never depend on
// reaching Google Fonts; this is the variable latin subset, weights 400–900.
export const outfit = localFont({
  src: "../fonts/Outfit-latin-variable.woff2",
  weight: "400 900",
  style: "normal",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
