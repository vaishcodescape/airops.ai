import { Copy } from 'lucide-react'
import { useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
interface ResponseBoxProps {
  response: string
  onClose: () => void
}

export function ResponseBox({ response, onClose }: ResponseBoxProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="response-box no-drag" onClick={onClose}>
      <div className="response-content" onClick={(e) => e.stopPropagation()}>
        {response}
      </div>
      <div className="response-footer" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleCopy}
          className="response-copy-btn"
        >
          {copied ? (
            <>
              <Checkbox
                checked={true}
                className="w-3.5 h-3.5 pointer-events-none border-zinc-600"
              />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 transition-transform group-hover:rotate-12 duration-200" />
              <span>Copy</span>
            </>
          )}
        </button>
        <span className="response-hint">Click outside to dismiss</span>
      </div>
    </div>
  )
}
