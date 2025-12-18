import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { ResponseBox } from './response-box'
import { Kbd } from './ui/kbd'
import { Separator } from './ui/separator'


const placeholders = ['Automate Anything...', 'Automate your tasks with AirOps']

export function FloatingNavbar() {
  const [input, setInput] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const toggleMinimize = useCallback(() => {
    setIsTransitioning(true)
    setMinimized((prev) => {
      const newState = !prev
      // Focus input when expanding
      if (!newState) {
        setTimeout(() => inputRef.current?.focus(), 300)
      }
      return newState
    })
    setTimeout(() => setIsTransitioning(false), 300)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return
    setResponse(`${input}\n\nThis is a sample response. Connect to your AI backend to get real responses.`)
    setInput('')
  }, [input])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    
    // Cmd/Ctrl + M to minimize/expand
    if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
      e.preventDefault()
      toggleMinimize()
    }
    // Escape to close response or minimize
    if (e.key === 'Escape') {
      if (response) {
        setResponse(null)
      } else if (!minimized) {
        toggleMinimize()
      }
    }
  }, [toggleMinimize, response, minimized])

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (minimized) return

    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)
        setIsAnimating(false)
      }, 150)
    }, 4000)

    return () => clearInterval(interval)
  }, [minimized])

  return (
    <div className="h-full flex flex-col items-center justify-start pt-5 gap-2">
      <div
        className={`navbar-container drag-region ${minimized ? 'minimized' : 'expanded'}`}
        onClick={minimized ? toggleMinimize : undefined}
      >
        <span className={`minimized-letter ${minimized ? 'visible' : 'hidden'}`}>
          A
        </span>

        <div className={`navbar-content ${minimized ? 'hidden' : 'visible'}`}>
          <div className="flex-1 relative no-drag">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="w-full bg-transparent border-none outline-none text-zinc-100 text-[13px] font-normal"
              placeholder=""
              disabled={minimized || isTransitioning}
            />
            {!input && (
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500 text-[13px] font-normal pointer-events-none transition-all duration-150 ${isAnimating ? 'opacity-0 translate-y-1' : 'opacity-100'
                  }`}
              >
                {placeholders[placeholderIndex]}
              </span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 no-drag ${input.trim()
              ? 'bg-zinc-100 text-zinc-900 hover:bg-white'
              : 'bg-zinc-800 text-zinc-600'
              }`}
            disabled={minimized || isTransitioning || !input.trim()}
          >
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      {!minimized && !response && (
        <div className="flex items-center gap-2.5 text-[11px] text-zinc-500 animate-in fade-in duration-300">
          <div className="flex items-center gap-1.5">
            <Kbd>⌘ M</Kbd>
            <span>Minimize</span>
          </div>
          <Separator orientation="vertical" className="h-3 bg-zinc-700/50" />
          <div className="flex items-center gap-1.5">
            <Kbd>↵</Kbd>
            <span>Submit</span>
          </div>
          <Separator orientation="vertical" className="h-3 bg-zinc-700/50" />
          <div className="flex items-center gap-1.5">
            <Kbd>Esc</Kbd>
            <span>Close</span>
          </div>
        </div>
      )}

      {response && !minimized && (
        <ResponseBox
          response={response}
          onClose={() => setResponse(null)}
        />
      )}
    </div>
  )
}
