import { useState, useEffect, useRef } from "react"
import { Bell, X, CheckCheck, ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { notificationsApi } from "../api/client"
import { usePremium } from "./PremiumToggle"

const TYPE_STYLES = {
  application_accepted: "bg-green-50 border-green-200",
  application_rejected: "bg-red-50 border-red-200",
  port_invitation:      "bg-blue-50 border-blue-200",
  new_need:             "bg-brand/5 border-brand/20",
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const role = localStorage.getItem("port2region_role")
  const isPremium = usePremium()

  const currentPme = (() => {
    try { return JSON.parse(localStorage.getItem("port2region_current_pme") || "null") } catch { return null }
  })()

  const unread = notifs.filter(n => !n.read).length

  async function fetchNotifs() {
    try {
      if (role === "pme" && currentPme?.id) {
        const res = await notificationsApi.forPme(currentPme.id)
        setNotifs(res.data.data || [])
      } else if (role === "investisseur" && isPremium) {
        const res = await notificationsApi.forInvestisseur()
        setNotifs(res.data.data || [])
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, currentPme?.id, isPremium])

  // Close on outside click
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  async function markAllRead() {
    try {
      if (role === "pme" && currentPme?.id) {
        await notificationsApi.markAllRead({ sme_id: currentPme.id })
      } else if (role === "investisseur") {
        await notificationsApi.markAllRead({ recipient_type: "investisseur" })
      }
      setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    } catch { /* silent */ }
  }

  async function handleClick(notif) {
    if (!notif.read) {
      await notificationsApi.markRead(notif.id)
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
    }
    if (notif.link) {
      setOpen(false)
      navigate(notif.link)
    }
  }

  // Only show for PME and premium investor
  if (role !== "pme" && !(role === "investisseur" && isPremium)) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className={unread > 0 ? "text-brand" : "text-muted"} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-slate-900">Notifications</p>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-brand hover:underline flex items-center gap-1">
                  <CheckCheck size={12} /> Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted hover:text-slate-700">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-muted">Aucune notification</p>
              </div>
            ) : (
              notifs.slice(0, 20).map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!notif.read ? "bg-brand/5" : ""}`}
                >
                  <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${!notif.read ? "bg-brand" : "bg-transparent"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-snug ${!notif.read ? "text-slate-900" : "text-slate-600"}`}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5 leading-snug line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-muted mt-1">
                      {new Date(notif.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {notif.link && <ExternalLink size={11} className="text-muted flex-shrink-0 mt-1" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
