'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

type FeedbackType = 'bug' | 'feature' | 'general'

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('general')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSubmitted(false)
        setError('')
      }, 300)
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please add a title')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim() || null,
          page_url: pathname,
          metadata: {
            screen_width: window.innerWidth,
            screen_height: window.innerHeight,
            timestamp: new Date().toISOString(),
          },
        }),
      })

      if (!res.ok) throw new Error('Failed to submit')

      setSubmitted(true)
      setTitle('')
      setDescription('')
      setType('general')

      // Auto-close after success
      setTimeout(() => setIsOpen(false), 2000)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const typeConfig = {
    bug: { emoji: '\u{1F41B}', label: 'Bug Report', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
    feature: { emoji: '\u{1F4A1}', label: 'Feature Idea', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
    general: { emoji: '\u{1F4AC}', label: 'General', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg
          flex items-center justify-center transition-all duration-300
          ${isOpen
            ? 'bg-slate-700 rotate-45 scale-90'
            : 'bg-gradient-to-br from-sky-500 to-indigo-600 hover:scale-110 hover:shadow-xl'
          }`}
        aria-label="Send feedback"
      >
        {isOpen ? (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Feedback panel */}
      <div
        ref={panelRef}
        className={`fixed bottom-20 right-6 z-50 w-[340px] max-h-[480px] overflow-y-auto
          bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl
          transition-all duration-300 origin-bottom-right
          ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-4 pointer-events-none'}`}
      >
        {submitted ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">{'\u2728'}</div>
            <p className="text-white font-semibold text-lg">Thanks for your feedback!</p>
            <p className="text-white/50 text-sm mt-1">We&apos;ll review it soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4">
            <h3 className="text-white font-semibold text-base mb-3">Send Feedback</h3>

            {/* Type selector */}
            <div className="flex gap-2 mb-3">
              {(Object.keys(typeConfig) as FeedbackType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-medium transition-all
                    ${type === t
                      ? typeConfig[t].color + ' border-current'
                      : 'text-white/40 bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                  {typeConfig[t].emoji} {typeConfig[t].label}
                </button>
              ))}
            </div>

            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'bug' ? 'What went wrong?' : type === 'feature' ? 'What would you like?' : 'Your feedback...'}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                placeholder:text-white/30 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/25
                mb-2"
              autoFocus={isOpen}
            />

            {/* Description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details (optional)..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                placeholder:text-white/30 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/25
                resize-none mb-3"
            />

            {error && (
              <p className="text-red-400 text-xs mb-2">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-medium
                rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending...
                </>
              ) : (
                'Submit Feedback'
              )}
            </button>

            <p className="text-white/30 text-[10px] mt-2 text-center">
              Page: {pathname} &bull; Beta v1.0
            </p>
          </form>
        )}
      </div>
    </>
  )
}
