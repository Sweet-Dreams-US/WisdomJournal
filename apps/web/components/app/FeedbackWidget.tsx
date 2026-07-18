'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Bug, Lightbulb, MessageCircle, Plus, Sparkles, type LucideIcon } from 'lucide-react'

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

  // Listen for sidebar "Send Feedback" button
  useEffect(() => {
    function handleOpenFeedback() {
      setIsOpen(true)
    }
    window.addEventListener('open-feedback', handleOpenFeedback)
    return () => window.removeEventListener('open-feedback', handleOpenFeedback)
  }, [])

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

  const typeConfig: Record<FeedbackType, { icon: LucideIcon; label: string; selected: string }> = {
    bug: { icon: Bug, label: 'Bug', selected: 'text-error bg-error/10 border-error/30' },
    feature: { icon: Lightbulb, label: 'Idea', selected: 'text-golden-hour bg-golden-hour/10 border-golden-hour/30' },
    general: { icon: MessageCircle, label: 'General', selected: 'text-deep-sky bg-deep-sky/10 border-deep-sky/30' },
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full
          flex items-center justify-center transition-all duration-300
          ${isOpen
            ? 'bg-twilight rotate-45 scale-90 shadow-card'
            : 'bg-twilight shadow-card hover:scale-110 hover:shadow-card-hover'
          }`}
        aria-label="Send feedback"
      >
        {isOpen ? (
          <Plus className="w-5 h-5 text-white" />
        ) : (
          <MessageCircle className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Feedback panel */}
      <div
        ref={panelRef}
        className={`fixed bottom-20 right-6 z-50 w-[340px] max-h-[480px] overflow-y-auto
          bg-white border border-charcoal/[0.08] rounded-2xl shadow-card-hover
          transition-all duration-300 origin-bottom-right
          ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-4 pointer-events-none'}`}
      >
        {submitted ? (
          <div className="p-6 text-center">
            <div className="relative mx-auto mb-3 flex w-12 h-12 items-center justify-center rounded-full bg-golden-hour/10 animate-scale-in">
              <Sparkles className="w-6 h-6 text-golden-hour" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-golden-hour/60 animate-breathe" />
              <span
                className="absolute -bottom-0.5 -left-1.5 w-1.5 h-1.5 rounded-full bg-golden-hour/40 animate-breathe"
                style={{ animationDelay: '600ms' }}
              />
            </div>
            <p className="font-heading text-twilight text-lg">Thanks for your feedback!</p>
            <p className="text-charcoal/50 text-sm mt-1">We&apos;ll review it soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4">
            <h3 className="text-twilight font-semibold text-base mb-3">Send Feedback</h3>

            {/* Type selector */}
            <div className="flex gap-2 mb-3">
              {(Object.keys(typeConfig) as FeedbackType[]).map((t) => {
                const TypeIcon = typeConfig[t].icon
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full border text-xs font-medium transition-all duration-200
                      ${type === t
                        ? typeConfig[t].selected
                        : 'text-charcoal/45 bg-charcoal/[0.03] border-charcoal/10 hover:bg-charcoal/[0.06] hover:text-charcoal/70'
                      }`}
                  >
                    <TypeIcon className="w-3.5 h-3.5" />
                    {typeConfig[t].label}
                  </button>
                )
              })}
            </div>

            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'bug' ? 'What went wrong?' : type === 'feature' ? 'What would you like?' : 'Your feedback...'}
              className="w-full bg-cloud-white border border-charcoal/10 rounded-input px-3 py-2 text-charcoal text-sm
                placeholder:text-charcoal/35 focus:outline-none focus:border-deep-sky/40 focus:ring-2 focus:ring-deep-sky/15
                transition-shadow duration-200 mb-2"
              autoFocus={isOpen}
            />

            {/* Description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details (optional)..."
              rows={3}
              className="w-full bg-cloud-white border border-charcoal/10 rounded-input px-3 py-2 text-charcoal text-sm
                placeholder:text-charcoal/35 focus:outline-none focus:border-deep-sky/40 focus:ring-2 focus:ring-deep-sky/15
                transition-shadow duration-200 resize-none mb-3"
            />

            {error && (
              <p className="text-error text-xs mb-2">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 bg-gradient-to-r from-deep-sky to-sky-blue text-white text-sm font-semibold
                rounded-xl shadow-button hover:shadow-glow active:scale-[0.98] transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
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

            <p className="text-charcoal/30 text-[10px] mt-2 text-center">
              Page: {pathname} &bull; Beta v1.0
            </p>
          </form>
        )}
      </div>
    </>
  )
}
