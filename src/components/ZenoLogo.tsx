import { Sparkles } from "lucide-react";

export function ZenoLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-9 w-9" : "h-8 w-8";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-2">
      <div className={`grid ${dims} place-items-center rounded-xl bg-gradient-button shadow-glow`}>
        <Sparkles className={`${icon} text-primary-foreground`} />
      </div>
      <span className="text-base font-semibold tracking-tight">Zeno</span>
    </div>
  );
}
