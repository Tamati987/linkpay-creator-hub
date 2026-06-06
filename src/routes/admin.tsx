import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Crown, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { ZenoLogo } from "@/components/ZenoLogo";
import { useAuth } from "@/lib/auth";
import {
  claimAdmin,
  getAdminStatus,
  listProUsers,
  setUserProByEmail,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Zeno" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getStatus = useServerFn(getAdminStatus);
  const claim = useServerFn(claimAdmin);
  const listPro = useServerFn(listProUsers);
  const setPro = useServerFn(setUserProByEmail);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const statusQ = useQuery({
    queryKey: ["admin-status"],
    queryFn: () => getStatus(),
    enabled: !!user,
  });

  const isAdmin = !!statusQ.data?.isAdmin;
  const canBootstrap = !!statusQ.data?.canBootstrap;

  const proUsersQ = useQuery({
    queryKey: ["admin-pro-users"],
    queryFn: () => listPro(),
    enabled: isAdmin,
  });

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const handleClaim = async () => {
    setBusy(true);
    try {
      await claim();
      toast.success("Vous êtes désormais administrateur.");
      qc.invalidateQueries({ queryKey: ["admin-status"] });
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const handleSet = async (is_pro: boolean) => {
    if (!email.trim()) return toast.error("Email requis");
    setBusy(true);
    try {
      const res = await setPro({ data: { email: email.trim(), is_pro } });
      toast.success(
        is_pro
          ? `Pro activé pour ${res.email}`
          : `Pro désactivé pour ${res.email}`,
      );
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin-pro-users"] });
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setBusy(false);
    }
  };

  if (loading || statusQ.isLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border glass">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <Link to="/"><ZenoLogo size="sm" /></Link>
          <Link
            to="/dashboard"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium hover:bg-surface-elevated"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Panneau admin</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Activez ou désactivez Zeno Pro pour un utilisateur après confirmation
          du paiement PayPal.
        </p>

        {!isAdmin && canBootstrap && (
          <div className="mt-8 rounded-xl border border-primary/40 glass p-5">
            <h2 className="font-medium">Initialisation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Aucun administrateur n'existe encore. Cliquez ci-dessous pour
              devenir le premier admin de ce projet.
            </p>
            <button
              onClick={handleClaim}
              disabled={busy}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-button px-4 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
            >
              <Crown className="h-4 w-4" /> Devenir administrateur
            </button>
          </div>
        )}

        {!isAdmin && !canBootstrap && (
          <div className="mt-8 rounded-xl border border-border glass p-5 text-sm text-muted-foreground">
            Accès refusé. Vous n'êtes pas administrateur.
          </div>
        )}

        {isAdmin && (
          <>
            <section className="mt-8 rounded-xl border border-border glass p-5">
              <h2 className="font-medium">Gérer le statut Pro</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Saisissez l'email du compte Zeno (celui utilisé à l'inscription).
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="utilisateur@email.com"
                  className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSet(true)}
                    disabled={busy}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gradient-button px-3 text-xs font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Activer Pro
                  </button>
                  <button
                    onClick={() => handleSet(false)}
                    disabled={busy}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium hover:bg-surface-elevated disabled:opacity-60"
                  >
                    <UserX className="h-3.5 w-3.5" /> Retirer
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-xl border border-border glass p-5">
              <h2 className="font-medium">
                Utilisateurs Pro actifs ({proUsersQ.data?.users.length ?? 0})
              </h2>
              <div className="mt-4 divide-y divide-border">
                {(proUsersQ.data?.users ?? []).map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{u.display_name || u.username}</div>
                      <div className="truncate text-xs text-muted-foreground">@{u.username}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      <Crown className="h-3 w-3" /> Pro
                    </span>
                  </div>
                ))}
                {proUsersQ.data && proUsersQ.data.users.length === 0 && (
                  <p className="py-4 text-sm text-muted-foreground">Aucun utilisateur Pro pour le moment.</p>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
