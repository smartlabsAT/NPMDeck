/**
 * Custom hook for clipboard copy functionality with visual feedback
 * Extracted from ProxyHostDetailsDialog, DeadHostDetailsDialog,
 * CertificateDetailsDialog, StreamDetailsDialog, AccessListDetailsDialog
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { TIMING } from '../constants/timing'

/**
 * Hook that provides clipboard copy functionality with a temporary feedback state.
 *
 * @param resetDelay - Time in ms before copiedText resets to empty (default: TIMING.CLIPBOARD_RESET)
 * @returns Object with copiedText state and copyToClipboard function
 */
export function useCopyToClipboard(resetDelay = TIMING.CLIPBOARD_RESET) {
  const [copiedText, setCopiedText] = useState<string>('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const copyToClipboard = useCallback(
    (text: string, label?: string) => {
      navigator.clipboard.writeText(text)
      setCopiedText(label || text)

      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => setCopiedText(''), resetDelay)
    },
    [resetDelay],
  )

  return { copiedText, copyToClipboard }
}
