import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowRight, Settings, Clock, Loader2, Wrench, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [response, setResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCapturingScreen, setIsCapturingScreen] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected')
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [showScreenshotDropdown, setShowScreenshotDropdown] = useState(false)
  const [chatHistory, setChatHistory] = useState([
    { id: 1, query: 'How do I automate email workflows?', timestamp: '2 hours ago' },
    { id: 2, query: 'Create a customer onboarding flow', timestamp: '5 hours ago' },
    { id: 3, query: 'Automate social media posting', timestamp: 'Yesterday' },
  ])
  const inputRef = useRef<HTMLInputElement>(null)

  const toggleMinimize = useCallback(() => {
    setMinimized((prev) => {
      const newState = !prev
      // Focus input when expanding
      if (!newState) {
        setTimeout(() => inputRef.current?.focus(), 250)
      }
      return newState
    })
  }, [])

  const handleCaptureScreen = useCallback(async (silent = false) => {
    if (!window.ipcRenderer || isCapturingScreen) return

    try {
      setIsCapturingScreen(true)
      const dataUrl = await window.ipcRenderer.captureScreen()
      setScreenshot(dataUrl)
      
      // Only add text notification if not silent (manual capture)
      if (!silent && !input.trim()) {
        // Silent auto-capture doesn't add text
      }
    } catch (error) {
      console.error('Failed to capture screen:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Only show error to user if not silent or if it's a permission error
      if (!silent || errorMessage.toLowerCase().includes('permission')) {
        alert(`Screen capture failed: ${errorMessage}\n\nIf on macOS, please grant screen recording permissions in System Settings > Privacy & Security > Screen Recording.`)
      }
    } finally {
      setIsCapturingScreen(false)
    }
  }, [input, isCapturingScreen])

  const handleSubmit = useCallback(() => {
    if ((!input.trim() && !screenshot) || isLoading) return

    setIsLoading(true)

    // Include screenshot data in the prompt if available
    const promptWithScreenshot = screenshot 
      ? `${input}\n\n[Screenshot: ${screenshot.substring(0, 50)}...]`
      : input

    // Dummy API call
    setTimeout(() => {
      setResponse(`${promptWithScreenshot}\n\nThis is a sample response. Connect to your AI backend to get real responses.`)
      setInput('')
      setScreenshot(null)
      setShowScreenshotDropdown(false)
      setIsLoading(false)
    }, 1500)
  }, [input, screenshot, isLoading])

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
    // Cmd/Ctrl + Shift + S to manually recapture screen
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 's') {
      e.preventDefault()
      handleCaptureScreen(false) // Manual capture (not silent)
    }
  }, [toggleMinimize, response, minimized, handleCaptureScreen])

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

  // Track if we need to capture (on mount or when expanding)
  const shouldCaptureRef = useRef(true)

  // Automatically capture screen when component mounts or when expanding
  useEffect(() => {
    if (!minimized && window.ipcRenderer && shouldCaptureRef.current) {
      // Small delay to ensure smooth expansion animation
      const timer = setTimeout(() => {
        handleCaptureScreen(true) // Silent auto-capture
        shouldCaptureRef.current = false
      }, 300)
      return () => clearTimeout(timer)
    } else if (minimized) {
      // Reset flag when minimized so we capture again when expanded
      shouldCaptureRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimized])

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

  const containerVariants = {
    expanded: {
      width: 520,
      height: 46,
      paddingLeft: 14,
      paddingRight: 5,
      paddingTop: 0,
      paddingBottom: 0,
      borderRadius: 23,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 35,
        mass: 0.5
      }
    },
    minimized: {
      width: 46,
      height: 46,
      padding: 0,
      borderRadius: 23,
      scale: 0.98,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 35,
        mass: 0.5
      }
    }
  }

  const letterVariants = {
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.05,
        type: "spring" as const,
        stiffness: 600,
        damping: 30
      }
    },
    hidden: {
      opacity: 0,
      scale: 0.3,
      transition: {
        type: "spring" as const,
        stiffness: 600,
        damping: 30
      }
    }
  }

  const contentVariants = {
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        delay: 0.06,
        type: "spring" as const,
        stiffness: 500,
        damping: 35
      }
    },
    hidden: {
      opacity: 0,
      scale: 0.92,
      x: -8,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 35
      }
    }
  }

  const statusBarVariants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 35
      }
    },
    hidden: {
      opacity: 0,
      y: -10,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 35
      }
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-start pt-5 gap-2">
      {/* Status bar - only when expanded */}
      <AnimatePresence>
      {!minimized && (
          <motion.div
            className="status-bar drag-region"
            variants={statusBarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="navbar-container drag-region"
        variants={containerVariants}
        animate={minimized ? "minimized" : "expanded"}
        initial={false}
        onClick={minimized ? toggleMinimize : undefined}
        whileHover={minimized ? { 
          scale: 1.08,
          transition: { type: "spring" as const, stiffness: 600, damping: 30 }
        } : {}}
        whileTap={minimized ? { 
          scale: 0.92,
          transition: { type: "spring" as const, stiffness: 600, damping: 30 }
        } : {}}
      >
        <motion.div
          className="minimized-letter-wrapper"
          variants={letterVariants}
          animate={minimized ? "visible" : "hidden"}
          initial={false}
        >
          <img
            src="/AirOps.ai Logo.svg"
            alt="AirOps"
            className="minimized-letter"
          />
        </motion.div>

        <motion.div
          className="navbar-content"
          variants={contentVariants}
          animate={minimized ? "hidden" : "visible"}
          initial={false}
        >
          {/* Chat history icon */}
          <div className="relative no-drag">
            <button
              className="icon-button-large"
              title="Chat history"
              onClick={() => {
                setShowHistory(!showHistory)
                if (!showHistory) {
                  setShowTools(false)
                  setShowScreenshotDropdown(false)
                }
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

          {/* Screen capture button - manual recapture */}
          <div className="relative no-drag">
            <button
              className="icon-button-large"
              title="Screen capture (⌘⇧S)"
              onClick={() => {
                if (screenshot) {
                  setShowScreenshotDropdown(!showScreenshotDropdown)
                  setShowTools(false)
                  setShowHistory(false)
                } else {
                  handleCaptureScreen(false)
                }
              }}
              disabled={isCapturingScreen || minimized}
            >
              {isCapturingScreen ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Monitor className={`w-3.5 h-3.5 ${screenshot ? 'text-emerald-400' : ''}`} />
              )}
            </button>

            {screenshot && showScreenshotDropdown && (
              <div className="history-dropdown" style={{ minWidth: '280px' }}>
                <div className="history-header flex items-center justify-between">
                  <span>Screenshot Captured</span>
                  <span className="text-emerald-400 text-[10px] font-medium">Ready</span>
                </div>
                <div className="p-3">
                  <div className="rounded-lg overflow-hidden border border-zinc-700/50 bg-zinc-900/50 mb-2">
                    <img 
                      src={screenshot} 
                      alt="Screenshot" 
                      className="w-full h-auto max-h-[200px] object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex-1 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700 hover:border-zinc-600 transition-colors"
                      onClick={() => {
                        handleCaptureScreen(false)
                        setShowScreenshotDropdown(false)
                      }}
                    >
                      Recapture
                    </button>
                    <button
                      className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700 hover:border-zinc-600 transition-colors"
                      onClick={() => {
                        setScreenshot(null)
                        setShowScreenshotDropdown(false)
                      }}
                      title="Remove screenshot"
                    >
                      ✕
                    </button>
                  </div>
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
                if (!showTools) {
                  setShowHistory(false)
                  setShowScreenshotDropdown(false)
                }
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
              disabled={minimized || isLoading}
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
            disabled={minimized || (!input.trim() && !screenshot) || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
        </motion.div>
      </motion.div>

      {/* Keyboard shortcuts hint */}
      {!minimized && !response && (
        <div className="shortcuts-hint">
          <div className="flex items-center gap-1.5">
            <Kbd>⌘ M</Kbd>
            <span>Minimize</span>
          </div>
          <Separator orientation="vertical" className="h-3 bg-zinc-700/50" />
          <div className="flex items-center gap-1.5">
            <Kbd>⌘⇧ S</Kbd>
            <span>Capture</span>
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
