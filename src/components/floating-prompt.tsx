import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowRight, Settings, Clock, Loader2, Wrench } from 'lucide-react'
import { ResponseBox } from './response-box'
import { Kbd } from './ui/kbd'
import { Separator } from './ui/separator'


const placeholders = ['Automate Anything...', 'Automate your tasks with AirOps']

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

export function FloatingNavbar() {
  const [input, setInput] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected')
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [chatHistory, setChatHistory] = useState([
    { id: 1, query: 'How do I automate email workflows?', timestamp: '2 hours ago' },
    { id: 2, query: 'Create a customer onboarding flow', timestamp: '5 hours ago' },
    { id: 3, query: 'Automate social media posting', timestamp: 'Yesterday' },
  ])
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
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setResponse(`${input}\n\nThis is a sample response. Connect to your AI backend to get real responses.`)
      setInput('')
      setIsLoading(false)
    }, 1500)
  }, [input, isLoading])

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
    // Cmd/Ctrl + , to open settings
    if ((e.metaKey || e.ctrlKey) && e.key === ',') {
      e.preventDefault()
      setShowSettings((prev) => !prev)
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

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-emerald-500'
      case 'connecting': return 'bg-amber-500'
      case 'disconnected': return 'bg-red-500'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected'
      case 'connecting': return 'Connecting...'
      case 'disconnected': return 'Disconnected'
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-start pt-5 gap-2">
      {/* Status bar - only when expanded */}
      {!minimized && (
        <div className="status-bar drag-region">
          <div className="flex items-center gap-2">
            <div className={`status-dot ${getStatusColor()}`} />
            <span className="status-text">{getStatusText()}</span>
          </div>
          <button
            className="icon-button no-drag"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings (⌘,)"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div
        className={`navbar-container drag-region ${minimized ? 'minimized' : 'expanded'}`}
        onClick={minimized ? toggleMinimize : undefined}
      >
        <span className={`minimized-letter ${minimized ? 'visible' : 'hidden'}`} style={{ fontSize: '25px', fontWeight: 'bold' }}>
          A
        </span>

        <div className={`navbar-content ${minimized ? 'hidden' : 'visible'}`}>
          {/* Chat history icon */}
          <div className="relative no-drag">
            <button
              className="icon-button-large"
              title="Chat history"
              onClick={() => {
                setShowHistory(!showHistory)
                if (showHistory) setShowTools(false)
              }}
            >
              <Clock className="w-3.5 h-3.5" />
            </button>

            {showHistory && (
              <div className="history-dropdown">
                <div className="history-header">Recent Chats</div>
                <div className="history-list">
                  {chatHistory.map((chat) => (
                    <button
                      key={chat.id}
                      className="history-item"
                      onClick={() => {
                        setInput(chat.query)
                        setShowHistory(false)
                      }}
                    >
                      <div className="history-query">{chat.query}</div>
                      <div className="history-time">{chat.timestamp}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tools dropdown */}
          <div className="relative no-drag">
            <button
              className="icon-button-large"
              title="Tools"
              onClick={() => {
                setShowTools(!showTools)
                if (!showTools) setShowHistory(false)
              }}
            >
              <Wrench className="w-3.5 h-3.5" />
            </button>

            {showTools && (
              <div className="history-dropdown">
                <div className="history-header">Tools</div>
                <div className="history-list">
                  <button
                    className="history-item"
                    onClick={() => {
                      setShowTools(false)
                      // Handle tool action
                    }}
                  >
                    <div className="history-query">Export Workflow</div>
                    <div className="history-time">Save automation</div>
                  </button>
                  <button
                    className="history-item"
                    onClick={() => {
                      setShowTools(false)
                      // Handle tool action
                    }}
                  >
                    <div className="history-query">Import Template</div>
                    <div className="history-time">Load from file</div>
                  </button>
                  <button
                    className="history-item"
                    onClick={() => {
                      setShowTools(false)
                      // Handle tool action
                    }}
                  >
                    <div className="history-query">API Configuration</div>
                    <div className="history-time">Manage connections</div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Separator orientation="vertical" className="h-5 bg-zinc-700/50" />

          <div className="flex-1 relative no-drag">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="w-full bg-transparent border-none outline-none text-zinc-100 text-[13px] font-normal"
              placeholder=""
              disabled={minimized || isTransitioning || isLoading}
            />
            {!input && !isLoading && (
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500 text-[13px] font-normal pointer-events-none transition-all duration-150 ${isAnimating ? 'opacity-0 translate-y-1' : 'opacity-100'
                  }`}
              >
                {placeholders[placeholderIndex]}
              </span>
            )}
            {isLoading && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-500 text-[13px] font-normal pointer-events-none flex items-center gap-2 ">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing...
              </span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            className={`submit-button no-drag ${input.trim() && !isLoading
              ? 'active'
              : 'inactive'
              }`}
            disabled={minimized || isTransitioning || !input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      {!minimized && !response && (
        <div className="shortcuts-hint">
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

      {/* Settings Panel */}
      {showSettings && !minimized && (
        <div className="settings-panel">
          <div className="settings-header">
            <h3 className="text-sm font-semibold text-zinc-100">Settings</h3>
            <button onClick={() => setShowSettings(false)} className="icon-button">
              ✕
            </button>
          </div>
          <div className="settings-content">
            <div className="setting-item">
              <span className="text-xs text-zinc-400">API Status</span>
              <span className="text-xs text-emerald-400">Connected</span>
            </div>
            <div className="setting-item">
              <span className="text-xs text-zinc-400">Version</span>
              <span className="text-xs text-zinc-500">1.0.0</span>
            </div>
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
