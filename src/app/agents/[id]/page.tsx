'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Bot, ArrowLeft, Play, Settings2, Globe, FileText, Hash, ToggleLeft } from 'lucide-react'

export default function AgentPage({ params }: { params: { id: string } }) {
  const [actor, setActor] = useState<any>(null)
  const [actorInput, setActorInput] = useState<any>({})
  const [inputSchema, setInputSchema] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string>('')
  const [executionResult, setExecutionResult] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const apiKey = searchParams.get('apiKey')

  useEffect(() => {
    if (!apiKey) {
      router.push('/')
      return
    }

    fetchActorDetails()
    fetchActorInputSchema()
  }, [params.id, apiKey, router])

  const fetchActorDetails = async () => {
    try {
      console.log('Fetching actor details for:', params.id)
      
      const response = await fetch(`/api/apify/actors/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      console.log('Actor details response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Actor details error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch actor details')
      }

      const data = await response.json()
      console.log('Actor details received:', data)
      setActor(data)
    } catch (err) {
      console.error('Error fetching actor details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load actor')
    }
  }

  const fetchActorInputSchema = async () => {
    try {
      console.log('Fetching input schema for:', params.id)
      
      const response = await fetch(`/api/apify/actors/${params.id}/schema`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      console.log('Schema response status:', response.status)

      if (response.ok) {
        const schema = await response.json()
        console.log('Schema received:', schema)
        setInputSchema(schema)
        
        // Initialize input with default values from schema
        if (schema && schema.properties) {
          const defaultInput: any = {}
          Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
            if (prop.default !== undefined) {
              defaultInput[key] = prop.default
            } else if (prop.type === 'string') {
              // Special handling for URL fields - use exact key names from schema
              defaultInput[key] = ''
            } else if (prop.type === 'boolean') {
              defaultInput[key] = false
            } else if (prop.type === 'number' || prop.type === 'integer') {
              defaultInput[key] = 0
            } else if (prop.type === 'array') {
              // Handle array of URLs or start URLs
              if (key === 'startUrls' || key.toLowerCase().includes('url')) {
                defaultInput[key] = [{ url: '' }]
              } else {
                defaultInput[key] = []
              }
            } else if (prop.type === 'object') {
              defaultInput[key] = {}
            }
          })
          setActorInput(defaultInput)
          console.log('Default input initialized from schema:', defaultInput)
        } else {
          // Fallback: Try to detect expected fields from actor name/description
          const actorName = actor?.name?.toLowerCase() || params.id.toLowerCase()
          let fallbackInput: any = {}
          
          if (actorName.includes('inputurl') || actorName.includes('single')) {
            // Single URL input actors - try both variants
            fallbackInput = { inputurl: '' } // lowercase first
          } else if (actorName.includes('web-scraper') || actorName.includes('scraper')) {
            // Web scraper actors
            fallbackInput = {
              startUrls: [{ url: '' }],
              linkSelector: 'a[href]',
              pageFunction: `async function pageFunction(context) {
    return {
        url: context.request.url,
        title: await context.page.title(),
    };
}`
            }
          } else {
            // Generic fallback - try lowercase first, then camelCase
            fallbackInput = { inputurl: '' }
          }
          
          setActorInput(fallbackInput)
          console.log('Fallback input initialized:', fallbackInput)
        }
      } else {
        console.warn('Failed to fetch schema, using intelligent fallback')
        // Intelligent fallback based on actor ID
        const actorId = params.id.toLowerCase()
        let fallbackInput: any = {}
        
        if (actorId.includes('web-scraper') || actorId.includes('cheerio') || actorId.includes('puppeteer')) {
          fallbackInput = {
            startUrls: [{ url: '' }],
            linkSelector: 'a[href]',
            maxRequestsPerCrawl: 100
          }
        } else {
          // Most actors expect inputurl (lowercase)
          fallbackInput = { inputurl: '' }
        }
        
        setActorInput(fallbackInput)
        console.log('Intelligent fallback input:', fallbackInput)
      }
    } catch (err) {
      console.warn('Failed to fetch input schema:', err)
      // Default to inputurl (lowercase) which is most common
      setActorInput({ inputurl: '' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExecute = async () => {
    setIsExecuting(true)
    setError('')
    setExecutionResult(null)

    try {
      console.log('Executing actor:', params.id)
      console.log('Input data:', actorInput)
      
      const response = await fetch(`/api/apify/actors/${params.id}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input: actorInput })
      })

      console.log('Execution response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Execution error:', errorData)
        throw new Error(errorData.error || 'Failed to execute actor')
      }

      const result = await response.json()
      console.log('Execution result:', result)
      setExecutionResult(result)
    } catch (err) {
      console.error('Error executing actor:', err)
      setError(err instanceof Error ? err.message : 'Execution failed')
    } finally {
      setIsExecuting(false)
    }
  }

  const goBack = () => {
    router.push(`/agents?apiKey=${apiKey}`)
  }

  const updateInputField = (key: string, value: any) => {
    setActorInput(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateUrlField = (index: number, url: string) => {
    setActorInput(prev => ({
      ...prev,
      startUrls: prev.startUrls?.map((item: any, i: number) => 
        i === index ? { url } : item
      ) || [{ url }]
    }))
  }

  const addUrlField = () => {
    setActorInput(prev => ({
      ...prev,
      startUrls: [...(prev.startUrls || []), { url: '' }]
    }))
  }

  const removeUrlField = (index: number) => {
    setActorInput(prev => ({
      ...prev,
      startUrls: prev.startUrls?.filter((_: any, i: number) => i !== index) || []
    }))
  }

  const renderFormField = (key: string, prop: any, value: any) => {
    const fieldId = `field-${key}`
    
    // Handle inputUrl/inputurl specifically
    if (key === 'inputUrl' || key === 'inputurl' || (key.toLowerCase().includes('url') && prop?.type === 'string')) {
      return (
        <div key={key} className="space-y-2">
          <label htmlFor={fieldId} className="block text-white font-medium">
            <Globe className="inline h-4 w-4 mr-2" />
            {prop?.title || 'Input URL'} <span className="text-red-400">*</span>
          </label>
          <p className="text-gray-300 text-sm">
            {prop?.description || 'Enter the URL you want to process:'}
          </p>
          <input
            id={fieldId}
            type="url"
            value={value || ''}
            onChange={(e) => updateInputField(key, e.target.value)}
            placeholder="https://example.com"
            className="glass-input-field"
            required
          />
        </div>
      )
    }
    
    if (key === 'startUrls' || key === 'urls') {
      return (
        <div key={key} className="space-y-3">
          <label className="block text-white font-medium">
            <Globe className="inline h-4 w-4 mr-2" />
            Start URLs <span className="text-red-400">*</span>
          </label>
          <p className="text-gray-300 text-sm">Enter the URLs you want to scrape:</p>
          {(value || [{ url: '' }]).map((item: any, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="url"
                value={item.url || ''}
                onChange={(e) => updateUrlField(index, e.target.value)}
                placeholder="https://example.com"
                className="glass-input-field flex-1"
              />
              {index > 0 && (
                <button
                  onClick={() => removeUrlField(index)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addUrlField}
            className="text-purple-300 hover:text-purple-200 text-sm transition-colors"
          >
            + Add another URL
          </button>
        </div>
      )
    }

    if (prop?.type === 'boolean') {
      return (
        <div key={key} className="space-y-2">
          <label className="flex items-center gap-3 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => updateInputField(key, e.target.checked)}
              className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="font-medium">{prop.title || key}</span>
          </label>
          {prop.description && (
            <p className="text-gray-300 text-sm ml-8">{prop.description}</p>
          )}
        </div>
      )
    }

    if (prop?.type === 'number' || prop?.type === 'integer') {
      return (
        <div key={key} className="space-y-2">
          <label htmlFor={fieldId} className="block text-white font-medium">
            <Hash className="inline h-4 w-4 mr-2" />
            {prop.title || key} {prop.required && <span className="text-red-400">*</span>}
          </label>
          {prop.description && (
            <p className="text-gray-300 text-sm">{prop.description}</p>
          )}
          <input
            id={fieldId}
            type="number"
            value={value || ''}
            onChange={(e) => updateInputField(key, Number(e.target.value))}
            placeholder={prop.example || `Enter ${key}`}
            className="glass-input-field"
          />
        </div>
      )
    }

    if (prop?.enum) {
      return (
        <div key={key} className="space-y-2">
          <label htmlFor={fieldId} className="block text-white font-medium">
            {prop.title || key} {prop.required && <span className="text-red-400">*</span>}
          </label>
          {prop.description && (
            <p className="text-gray-300 text-sm">{prop.description}</p>
          )}
          <select
            id={fieldId}
            value={value || ''}
            onChange={(e) => updateInputField(key, e.target.value)}
            className="glass-input-field"
          >
            <option value="">Select an option...</option>
            {prop.enum.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )
    }

    // Default to text input for strings and other types
    return (
      <div key={key} className="space-y-2">
        <label htmlFor={fieldId} className="block text-white font-medium">
          <FileText className="inline h-4 w-4 mr-2" />
          {prop?.title || key} {prop?.required && <span className="text-red-400">*</span>}
        </label>
        {prop?.description && (
          <p className="text-gray-300 text-sm">{prop.description}</p>
        )}
        <input
          id={fieldId}
          type="text"
          value={value || ''}
          onChange={(e) => updateInputField(key, e.target.value)}
          placeholder={prop?.example || `Enter ${key}`}
          className="glass-input-field"
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="auth-card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            <span className="ml-3 text-white">Loading agent...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full p-4">
      <div className="max-w-4xl mx-auto">
        <div className="auth-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-white" />
              <div>
                <h1 className="auth-title mb-0">{actor?.name || params.id}</h1>
                {actor?.description && (
                  <p className="text-gray-300 text-sm mt-1">{actor.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={goBack}
              className="flex items-center gap-2 px-4 py-2 text-white hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>

        {error && (
          <div className="error-alert mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="note-section">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="h-5 w-5 text-yellow-400" />
              <h3 className="text-white font-semibold text-lg">Configuration</h3>
            </div>
            <p className="note-text mb-4">
              Configure the input parameters for this agent:
            </p>
            
            <div className="space-y-6">
              {inputSchema && inputSchema.properties ? (
                // Render form fields based on schema
                Object.entries(inputSchema.properties).map(([key, prop]) =>
                  renderFormField(key, prop, actorInput[key])
                )
              ) : (
                // Default form - intelligently show inputurl or startUrls based on actor input
                <>
                  {(actorInput.hasOwnProperty('inputUrl') || actorInput.hasOwnProperty('inputurl')) ? (
                    // Single URL input
                    <div className="space-y-2">
                      <label className="block text-white font-medium">
                        <Globe className="inline h-4 w-4 mr-2" />
                        Input URL <span className="text-red-400">*</span>
                      </label>
                      <p className="text-gray-300 text-sm">Enter the URL you want to process:</p>
                      <input
                        type="url"
                        value={actorInput.inputUrl || actorInput.inputurl || ''}
                        onChange={(e) => {
                          if (actorInput.hasOwnProperty('inputUrl')) {
                            updateInputField('inputUrl', e.target.value)
                          } else {
                            updateInputField('inputurl', e.target.value)
                          }
                        }}
                        placeholder="https://example.com"
                        className="glass-input-field"
                        required
                      />
                    </div>
                  ) : (
                    // Multiple URLs input
                    <div className="space-y-3">
                      <label className="block text-white font-medium">
                        <Globe className="inline h-4 w-4 mr-2" />
                        Start URLs <span className="text-red-400">*</span>
                      </label>
                      <p className="text-gray-300 text-sm">Enter the URLs you want to scrape:</p>
                      {(actorInput.startUrls || [{ url: '' }]).map((item: any, index: number) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="url"
                            value={item.url || ''}
                            onChange={(e) => updateUrlField(index, e.target.value)}
                            placeholder="https://example.com"
                            className="glass-input-field flex-1"
                          />
                          {index > 0 && (
                            <button
                              onClick={() => removeUrlField(index)}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addUrlField}
                        className="text-purple-300 hover:text-purple-200 text-sm transition-colors"
                      >
                        + Add another URL
                      </button>
                    </div>
                  )}

                  {/* Show additional fields only for multi-URL actors */}
                  {actorInput.hasOwnProperty('startUrls') && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-white font-medium">
                          <FileText className="inline h-4 w-4 mr-2" />
                          Link Selector
                        </label>
                        <p className="text-gray-300 text-sm">CSS selector for links to follow (optional):</p>
                        <input
                          type="text"
                          value={actorInput.linkSelector || ''}
                          onChange={(e) => updateInputField('linkSelector', e.target.value)}
                          placeholder="a[href] (default)"
                          className="glass-input-field"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-white font-medium">
                          <Hash className="inline h-4 w-4 mr-2" />
                          Max Pages
                        </label>
                        <p className="text-gray-300 text-sm">Maximum number of pages to scrape:</p>
                        <input
                          type="number"
                          value={actorInput.maxRequestsPerCrawl || 100}
                          onChange={(e) => updateInputField('maxRequestsPerCrawl', Number(e.target.value))}
                          placeholder="100"
                          className="glass-input-field"
                          min="1"
                          max="1000"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Input Schema Display */}
            {inputSchema && (
              <details className="mt-6">
                <summary className="text-purple-300 hover:text-purple-200 cursor-pointer text-sm">
                  📋 View Actor Input Schema
                </summary>
                <div className="mt-3">
                  <div className="glass-code-block">
                    <pre className="text-xs">{JSON.stringify(inputSchema, null, 2)}</pre>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    This shows the expected input format for this actor
                  </p>
                </div>
              </details>
            )}

            {/* Advanced JSON Editor Toggle */}
            <details className="mt-6">
              <summary className="text-purple-300 hover:text-purple-200 cursor-pointer text-sm">
                ⚙️ Advanced: Edit Raw JSON
              </summary>
              <div className="mt-3">
                <textarea
                  value={JSON.stringify(actorInput, null, 2)}
                  onChange={(e) => {
                    try {
                      setActorInput(JSON.parse(e.target.value))
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="glass-input-field min-h-32 font-mono text-sm"
                  placeholder="Enter JSON configuration..."
                />
              </div>
            </details>
          </div>

          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="connect-button"
          >
            {isExecuting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Executing...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Play className="h-5 w-5" />
                Execute Agent
              </div>
            )}
          </button>

          {executionResult && (
            <div className="note-section">
              <h3 className="text-white font-semibold mb-3">Execution Result</h3>
              <div className="glass-code-block">
                <pre>{JSON.stringify(executionResult, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}
