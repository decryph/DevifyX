import { NextRequest, NextResponse } from 'next/server'
import { ApifyClient } from 'apify'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7)
    const actorId = params.id
    const body = await request.json()
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    if (!actorId) {
      return NextResponse.json(
        { error: 'Actor ID is required' },
        { status: 400 }
      )
    }

    const { input } = body

    // Initialize Apify client with the API key
    const apifyClient = new ApifyClient({ token: apiKey })

    try {
      console.log(`Attempting to execute actor: ${actorId}`)
      console.log(`Input data:`, input)
      
      // First, verify the actor exists and is accessible
      try {
        const actorInfo = await apifyClient.actor(actorId).get()
        console.log('Actor info:', actorInfo)
      } catch (actorError) {
        console.error('Actor not accessible:', actorError)
        return NextResponse.json(
          { error: `Actor not found or not accessible: ${actorError instanceof Error ? actorError.message : 'Unknown error'}` },
          { status: 404 }
        )
      }
      
      // Start the actor run using the Apify SDK
      const run = await apifyClient.actor(actorId).call(input || {})
      console.log('Actor run started:', run)
      
      const runId = run.id

      if (!runId) {
        return NextResponse.json(
          { error: 'Failed to get run ID from Apify response' },
          { status: 500 }
        )
      }

      // Poll for the run to complete
      let runStatus = 'RUNNING'
      let resultData: any = null
      let attempts = 0
      const maxAttempts = 60 // Poll for up to 5 minutes (60 * 5 seconds)

      while (runStatus === 'RUNNING' && attempts < maxAttempts) {
        attempts++
        
        // Wait 5 seconds between polls
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        // Get run status using the Apify SDK
        const runDetails = await apifyClient.run(runId).get()
        
        if (!runDetails) {
          console.error('Failed to get run details')
          break
        }
        
        runStatus = runDetails.status

        console.log(`Run status: ${runStatus} (attempt ${attempts})`)

        if (runStatus === 'SUCCEEDED') {
          // Fetch the run results using the Apify SDK
          const datasetId = runDetails.defaultDatasetId
          
          if (datasetId) {
            try {
              const dataset = await apifyClient.dataset(datasetId).listItems()
              resultData = dataset
              console.log('Dataset items retrieved:', resultData.items?.length || 0)
            } catch (error) {
              console.error('Error fetching dataset:', error)
            }
          }
          
          break
        } else if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
          return NextResponse.json({
            id: runId,
            status: runStatus,
            error: (runDetails as any).error?.message || `Actor run ${runStatus.toLowerCase()}`
          })
        }
      }

      if (runStatus === 'RUNNING') {
        return NextResponse.json({
          id: runId,
          status: 'TIMEOUT',
          error: 'Actor run timed out'
        })
      }

      return NextResponse.json({
        id: runId,
        status: runStatus,
        data: resultData
      })

    } catch (error) {
      console.error('Error executing actor:', error)
      return NextResponse.json(
        { error: `Failed to execute actor: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in execute route:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}