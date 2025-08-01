'use client'

import { useState } from 'react'
import { Loader2, Key } from 'lucide-react'

export default function Home() {
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

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
      // In a real app, you might redirect or show success message
      console.log('Authentication successful:', data)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
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
          <p className="text-sm">
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
            className="glass-input-field"
          />
          <button 
            onClick={handleAuthenticate}
            disabled={isLoading || !apiKey.trim()}
            className="connect-button"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect'}
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
