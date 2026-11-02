import { Outfit } from "next/font/google";

// Display font for the public site (landing page & blog)
export const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});
