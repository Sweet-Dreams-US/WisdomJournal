// Global error tracking for beta

export function initErrorTracking() {
  if (typeof window === 'undefined') return

  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    logClientError({
      error_message: event.message,
      error_stack: event.error?.stack || null,
      page_url: window.location.pathname,
      severity: 'error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    })
  })

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason
    logClientError({
      error_message: error?.message || String(error),
      error_stack: error?.stack || null,
      page_url: window.location.pathname,
      severity: 'error',
      metadata: {
        type: 'unhandled_promise_rejection',
      },
    })
  })
}

async function logClientError(data: {
  error_message: string
  error_stack?: string | null
  component_stack?: string | null
  page_url?: string | null
  severity?: string
  metadata?: Record<string, any>
}) {
  try {
    await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        metadata: {
          ...data.metadata,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          screen_width: window.innerWidth,
          screen_height: window.innerHeight,
        },
      }),
    })
  } catch {
    // Silently fail
  }
}

export { logClientError }
