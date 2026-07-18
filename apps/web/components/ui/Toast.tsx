'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { CheckCircle2, XCircle, Info, AlertTriangle, X, type LucideIcon } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextType {
  toast: (type: ToastType, message: string, duration?: number) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timeout = timeouts.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeouts.current.delete(id)
    }
  }, [])

  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev.slice(-4), { id, type, message, duration }])

    const timeout = setTimeout(() => removeToast(id), duration)
    timeouts.current.set(id, timeout)
  }, [removeToast])

  useEffect(() => {
    return () => {
      timeouts.current.forEach((timeout) => clearTimeout(timeout))
    }
  }, [])

  const contextValue: ToastContextType = {
    toast: addToast,
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg),
    info: (msg) => addToast('info', msg),
  }

  const typeConfig: Record<ToastType, { icon: LucideIcon; accent: string; iconColor: string }> = {
    success: { icon: CheckCircle2, accent: 'border-l-success', iconColor: 'text-success' },
    error: { icon: XCircle, accent: 'border-l-error', iconColor: 'text-error' },
    info: { icon: Info, accent: 'border-l-deep-sky', iconColor: 'text-deep-sky' },
    warning: { icon: AlertTriangle, accent: 'border-l-golden-hour', iconColor: 'text-golden-hour' },
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const ToastIcon = typeConfig[t.type].icon
          return (
            <div
              key={t.id}
              className={`pointer-events-auto pl-3.5 pr-3 py-3 rounded-xl bg-white border border-charcoal/[0.08] border-l-4 shadow-card-hover
                text-twilight text-sm font-medium flex items-center gap-2.5 min-w-[250px] max-w-[400px]
                animate-slide-in-right
                ${typeConfig[t.type].accent}`}
            >
              <ToastIcon className={`w-4 h-4 shrink-0 ${typeConfig[t.type].iconColor}`} />
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 ml-2 text-charcoal/30 hover:text-charcoal/60 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
