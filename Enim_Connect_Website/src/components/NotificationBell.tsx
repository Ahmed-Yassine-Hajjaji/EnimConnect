import { useEffect, useRef, useState } from "react";
import { api, type Notification } from "../api/client";

function timeAgo(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      setUnread(data.filter((n) => !n.lu).length);
    } catch {
      // silently ignore — not critical
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleOpen() {
    setOpen((v) => !v);
    if (!open) load(); // refresh on open
  }

  async function markRead(id: string) {
    await api.marquerLue(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
    );
    setUnread((v) => Math.max(0, v - 1));
  }

  async function markAllRead() {
    await api.marquerToutLu();
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
    setUnread(0);
  }

  async function remove(id: string, wasUnread: boolean) {
    await api.supprimerNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnread((v) => Math.max(0, v - 1));
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-on-surface-variant text-xl">notifications</span>
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-surface border border-outline-variant rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <span className="font-semibold text-on-surface text-sm">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline font-medium"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">notifications_none</span>
                <p className="text-sm text-on-surface-variant">Aucune notification</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 border-b border-outline-variant/50 last:border-0 group transition-colors ${
                    n.lu ? "bg-surface" : "bg-primary/5"
                  }`}
                >
                  {/* Dot */}
                  <div className="mt-1 flex-shrink-0">
                    {n.lu ? (
                      <div className="w-2 h-2 rounded-full bg-transparent" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface leading-snug">{n.titre}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-on-surface-variant/60 mt-1">{timeAgo(n.created_at)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {!n.lu && (
                      <button
                        onClick={() => markRead(n.id)}
                        title="Marquer comme lu"
                        className="text-on-surface-variant hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-base">done</span>
                      </button>
                    )}
                    <button
                      onClick={() => remove(n.id, !n.lu)}
                      title="Supprimer"
                      className="text-on-surface-variant hover:text-error"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
