"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type Notification = {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    icon: string | null;
    linkUrl: string | null;
    read: boolean;
    createdAt: string;
  };
  patientName: string | null;
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* silently fail */ }
    setNow(Date.now());
  }, []);

  // Poll every 30s only when tab is visible + refresh on focus
  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      if (!cancelled && !document.hidden) await fetchNotifications();
    };

    const startPolling = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(load, 30000);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (interval) { clearInterval(interval); interval = null; }
      } else {
        load();
        startPolling();
      }
    };

    load();
    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = () => {
    if (!open) fetchNotifications();
    setOpen(!open);
  };

  const handleMarkRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) =>
        n.notification.id === id
          ? { ...n, notification: { ...n.notification, read: true } }
          : n
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, notification: { ...n.notification, read: true } }))
    );
    setUnreadCount(0);
  };

  const handleClick = (n: Notification) => {
    if (!n.notification.read) handleMarkRead(n.notification.id);
    if (n.notification.linkUrl) {
      router.push(n.notification.linkUrl);
    }
    setOpen(false);
  };

  const timeAgo = useCallback((dateStr: string) => {
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }, [now]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
        aria-label="Notificações"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[0.55rem] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-80 max-h-96 bg-white rounded-brand shadow-xl border border-primary/10 z-[100] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10 bg-bg/50">
            <span className="font-heading text-sm font-semibold text-txt">
              Notificações {unreadCount > 0 && <span className="text-primary-dark">({unreadCount})</span>}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[0.65rem] text-primary-dark font-bold hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <span className="text-2xl">🔕</span>
                <p className="text-sm text-txt-muted mt-2">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.notification.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-primary/5 hover:bg-bg/80 transition-colors ${
                    !n.notification.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-2.5 items-start">
                    <span className="text-base mt-0.5 flex-shrink-0">{n.notification.icon || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold truncate ${!n.notification.read ? "text-txt" : "text-txt-muted"}`}>
                          {n.notification.title}
                        </span>
                        <span className="text-[0.6rem] text-txt-muted flex-shrink-0">{timeAgo(n.notification.createdAt)}</span>
                      </div>
                      <p className={`text-[0.7rem] leading-snug mt-0.5 ${!n.notification.read ? "text-txt-light" : "text-txt-muted"}`}>
                        {n.notification.message}
                      </p>
                    </div>
                    {!n.notification.read && (
                      <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
