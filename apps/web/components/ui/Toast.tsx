'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

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

  const typeStyles = {
    success: 'bg-emerald-500/90 border-emerald-400/30',
    error: 'bg-red-500/90 border-red-400/30',
    info: 'bg-sky-500/90 border-sky-400/30',
    warning: 'bg-amber-500/90 border-amber-400/30',
  }

  const typeIcons = {
    success: '\u2713',
    error: '\u2715',
    info: '\u2139',
    warning: '\u26A0',
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg
              text-white text-sm font-medium flex items-center gap-2 min-w-[250px] max-w-[400px]
              animate-in slide-in-from-right-5 fade-in duration-300
              ${typeStyles[t.type]}`}
          >
            <span className="text-base shrink-0">{typeIcons[t.type]}</span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-white/60 hover:text-white ml-2"
            >
              {'\u2715'}
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
