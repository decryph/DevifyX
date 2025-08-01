'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Key } from 'lucide-react'

export default function Home() {
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const router = useRouter()

  const handleAuthenticate = async () => {
    if (!apiKey.trim()) {
      setError('API key is required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/apify/actors', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to authenticate with Apify API')
      }

      const data = await response.json()
      setError('')
      
      // Redirect to agents page with API key
      router.push(`/agents?apiKey=${encodeURIComponent(apiKey)}`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && apiKey.trim()) {
      handleAuthenticate()
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="auth-card">
        <h2 className="auth-title">
          <Key className="h-6 w-6" />
          Authentication
        </h2>
        <p className="auth-subtitle">
          Enter your Apify API key to get started
        </p>
        
        <div className="instructions-list">
          <p>You can find your API key in the Apify Console:</p>
          <ol>
            <li>Go to <a href="https://console.apify.com/" target="_blank" rel="noopener noreferrer" className="console-link">Apify Console</a></li>
            <li>Click on your profile in the top right</li>
            <li>Select "Settings" → "API tokens"</li>
            <li>Copy your API token</li>
          </ol>
        </div>

        <div className="note-section">
          <p className="note-text">
            <span className="note-highlight">Note:</span> You need to have actors available in your Apify account. 
            If you don't have any actors, you can use public actors like "apify/web-scraper".
          </p>
        </div>

        <div>
          <input
            type="password"
            placeholder="Enter your Apify API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyPress={handleKeyPress}
            className="glass-input-field"
          />
          <button 
            onClick={handleAuthenticate}
            disabled={isLoading || !apiKey.trim()}
            className="connect-button"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting...
              </div>
            ) : (
              'Connect'
            )}
          </button>
        </div>
        
        {error && (
          <div className="error-alert">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

