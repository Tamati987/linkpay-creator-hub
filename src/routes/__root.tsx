import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { AuthProvider, useAuth } from "@/lib/auth";
import { NotificationPanel } from "@/components/NotificationPanel";
import { TopNav } from "@/components/TopNav";
import { MessengerDock, openMessengerDock } from "@/components/MessengerDock";
import { useRouterState } from "@tanstack/react-router";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-semibold tracking-tight">404</h1>
        <p className="mt-3 text-muted-foreground">Cette page n'existe pas.</p>
        <a
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-gradient-button px-4 text-sm font-medium text-primary-foreground shadow-glow"
        >
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Oups, problème de chargement</h1>
        <p className="mt-2 text-sm text-muted-foreground">Une erreur inattendue est survenue. Merci de réessayer.</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-gradient-button px-4 text-sm font-medium text-primary-foreground shadow-glow"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { property: "og:site_name", content: "Zeno" },
      { property: "og:type", content: "website" },
      { title: "Lovable App" },
      { property: "og:title", content: "Lovable App" },
      { name: "twitter:title", content: "Lovable App" },
      { name: "description", content: "LinkKit Pro is a premium link-in-bio web app for creators, enabling profile customization and direct product sales." },
      { property: "og:description", content: "LinkKit Pro is a premium link-in-bio web app for creators, enabling profile customization and direct product sales." },
      { name: "twitter:description", content: "LinkKit Pro is a premium link-in-bio web app for creators, enabling profile customization and direct product sales." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/XkwWqkp6wIYFGBV1bA1PkachTYC3/social-images/social-1780449535717-IMG_0739.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/XkwWqkp6wIYFGBV1bA1PkachTYC3/social-images/social-1780449535717-IMG_0739.webp" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppChrome />
        <NotificationPanel />
        <Toaster theme="dark" position="bottom-left" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppChrome() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showChrome =
    !!user &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/signup") &&
    pathname !== "/";
  return (
    <>
      {showChrome && <TopNav onOpenMessenger={openMessengerDock} />}
      <Outlet />
      {showChrome && <MessengerDock />}
    </>
  );
}

