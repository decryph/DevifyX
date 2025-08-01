'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Bot, ArrowLeft, Play, Settings } from 'lucide-react'

export default function AgentsPage() {
  const [actors, setActors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const apiKey = searchParams.get('apiKey')

  useEffect(() => {
    if (!apiKey) {
      router.push('/')
      return
    }

    fetchActors()
  }, [apiKey, router])

  const fetchActors = async () => {
    try {
      console.log('Fetching actors with API key:', apiKey ? 'provided' : 'missing')
      
      const response = await fetch('/api/apify/actors', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch actors')
      }

      const data = await response.json()
      console.log('Received data:', data)
      console.log('Number of actors received:', data.items?.length || 0)
      console.log('Actor details:', data.items?.map((actor: any) => ({ 
        id: actor.id, 
        name: actor.name, 
        title: actor.title,
        source: actor.source 
      })))
      
      setActors(data.items || [])
      
      if (!data.items || data.items.length === 0) {
        setError('No actors found in your account. You may need to create some actors first or check your API key permissions.')
      } else {
        console.log(`Successfully loaded ${data.items.length} actors`)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load actors')
    } finally {
      setIsLoading(false)
    }
  }

  const handleActorSelect = (actorId: string) => {
    router.push(`/agents/${actorId}?apiKey=${apiKey}`)
  }

  const goBack = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="auth-card max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-white" />
            <h1 className="auth-title mb-0">Available Agents</h1>
          </div>
          <button
            onClick={goBack}
            className="flex items-center gap-2 px-4 py-2 text-white hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <p className="auth-subtitle">
          Select an agent to configure and execute
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            <span className="ml-3 text-white">Loading agents...</span>
          </div>
        ) : error ? (
          <div className="error-alert">
            {error}
          </div>
        ) : actors.length === 0 ? (
          <div className="note-section">
            <p className="note-text">
              <span className="note-highlight">No agents found.</span> 
              <br /><br />
              Possible reasons:
              <br />• Your API key might not have the correct permissions
              <br />• You may need to create actors in your Apify account first
              <br />• Try refreshing or check your internet connection
              <br /><br />
              You can also create new actors in the <a href="https://console.apify.com/actors" target="_blank" rel="noopener noreferrer" className="console-link">Apify Console</a>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actors.map((actor: any) => (
              <div
                key={actor.id}
                className="glass-agent-card"
                onClick={() => handleActorSelect(actor.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-400" />
                    <h3 className="font-semibold text-white truncate">
                      {actor.name || actor.id}
                    </h3>
                  </div>
                  <Play className="h-4 w-4 text-purple-300 opacity-70" />
                </div>
                
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {actor.description || 'No description available'}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="glass-badge-info">
                    {actor.isPublic ? 'Public' : 'Private'}
                  </span>
                  <button className="text-purple-300 hover:text-purple-200 transition-colors">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
