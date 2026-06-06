import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bell, Loader2 } from "lucide-react";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/lib/notifications.functions";

type Settings = {
  new_link: boolean;
  new_product: boolean;
  new_follow: boolean;
  profile_update: boolean;
};

const LABELS: Record<keyof Settings, string> = {
  new_follow: "Nouveaux abonnés",
  new_link: "Nouveaux liens d'un créateur suivi",
  new_product: "Nouveaux produits d'un créateur suivi",
  profile_update: "Mises à jour de profil d'un créateur suivi",
};

export function NotificationSettingsSection() {
  const fetchSettings = useServerFn(getNotificationSettings);
  const saveSettings = useServerFn(updateNotificationSettings);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings().then((r) => setSettings(r.settings as Settings));
  }, []);

  const toggle = async (key: keyof Settings) => {
    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSaving(true);
    try {
      await saveSettings({ data: next });
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <h2 className="text-sm font-semibold tracking-tight">Notifications</h2>
        </div>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {!settings ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <ul className="space-y-3">
          {(Object.keys(LABELS) as (keyof Settings)[]).map((k) => (
            <li key={k} className="flex items-center justify-between gap-4">
              <span className="text-sm">{LABELS[k]}</span>
              <button
                type="button"
                role="switch"
                aria-checked={settings[k]}
                onClick={() => toggle(k)}
                className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${
                  settings[k] ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    settings[k] ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
