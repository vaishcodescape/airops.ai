import { Copy, ThumbsUp, ThumbsDown, Share2, Check } from 'lucide-react'
import { useState } from 'react'

interface ResponseBoxProps {
  response: string
  onClose: () => void
}

export function ResponseBox({ response, onClose }: ResponseBoxProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: response,
          title: 'AirOps Response'
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    }
  }

  return (
    <div className="response-box no-drag">
      <div className="response-content" onClick={(e) => e.stopPropagation()}>
        {response}
      </div>
      <div className="response-footer" onClick={(e) => e.stopPropagation()}>
        <div className="response-actions">
          <button
            onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
            className={`response-action-btn ${feedback === 'up' ? 'active' : ''}`}
            title="Good response"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
            className={`response-action-btn ${feedback === 'down' ? 'active' : ''}`}
            title="Bad response"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            className="response-action-btn"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={handleShare}
            className="response-action-btn"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <button onClick={onClose} className="response-close-btn">
          Close
        </button>
      </div>
    </div>
  )
}
