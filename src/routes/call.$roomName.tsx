import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/call/$roomName")({
  head: ({ params }) => ({
    meta: [{ title: `Appel — ${params.roomName}` }],
  }),
  component: CallPage,
});

function CallPage() {
  const { roomName } = Route.useParams();
  const search = Route.useSearch() as { mode?: string };
  const mode = search.mode === "audio" ? "audio" : "video";
  const url = `https://zeno-app.daily.co/${roomName}`;
  // Use the actual returned domain — fall back to URL passed via query if present
  const params = new URLSearchParams(window.location.search);
  const fullUrl = params.get("url") || url;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <header className="flex items-center gap-3 border-b border-white/10 bg-black/80 px-4 py-2 text-white">
        <Link
          to="/"
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-sm font-semibold">
          {mode === "audio" ? "Appel vocal" : "Appel vidéo"} · Zeno
        </div>
      </header>
      <iframe
        title="Appel Zeno"
        src={fullUrl}
        allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
        className="flex-1 w-full border-0"
      />
    </div>
  );
}
