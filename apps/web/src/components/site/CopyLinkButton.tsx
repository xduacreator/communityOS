"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Salin link artikel:", url);
        }
      }}
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold shadow-[0_1px_0_#E6E6E0] transition hover:bg-[#FBFBF8]"
    >
      {copied ? <Check className="h-4 w-4 text-[#0B7A5E]" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
      {copied ? "Tersalin!" : "Salin link"}
    </button>
  );
}
