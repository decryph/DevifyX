import { NextRequest, NextResponse } from 'next/server'
import { ApifyClient } from 'apify'

export async function GET(
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

    // Initialize Apify client with the API key
    const apifyClient = new ApifyClient({ token: apiKey })

    try {
      // Get actor details
      const actor = await apifyClient.actor(actorId).get()
      console.log('Actor details retrieved:', actor)
      
      if (!actor) {
        return NextResponse.json(
          { error: 'Actor not found' },
          { status: 404 }
        )
      }

      // Format the actor data
      const actorData = {
        id: actor.id,
        name: actor.name,
        title: actor.title || actor.name,
        description: actor.description || 'No description available',
        isPublic: actor.isPublic || false,
        stats: actor.stats,
        createdAt: actor.createdAt,
        modifiedAt: actor.modifiedAt,
        username: actor.username
      }

      return NextResponse.json(actorData)
    } catch (error) {
      console.error('Apify API error:', error)
      return NextResponse.json(
        { error: `Failed to fetch actor details: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in actor detail route:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
