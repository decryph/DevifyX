import { NextRequest, NextResponse } from 'next/server'
import { ApifyClient } from 'apify'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7)
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Initialize Apify client with the API key
    const apifyClient = new ApifyClient({ token: apiKey })

    try {
      // Test the API key by getting user info
      const userInfo = await apifyClient.user().get()
      console.log('User info retrieved:', userInfo)
    } catch (error) {
      console.error('Apify authentication error:', error)
      return NextResponse.json(
        { error: `Authentication failed: ${error instanceof Error ? error.message : 'Invalid API key'}. Please check your API key.` },
        { status: 401 }
      )
    }

    // Try to get user's actors with multiple approaches
    let actors: any[] = []
    let userInfo: any = null
    
    try {
      // Get user info first
      userInfo = await apifyClient.user().get()
      console.log('User info:', { username: userInfo?.username, id: userInfo?.id })
    } catch (error) {
      console.error('Error getting user info:', error)
    }
    
    // Method 1: Try to get user's actors with my: true
    try {
      console.log('Method 1: Fetching user actors with my: true')
      const userActors = await apifyClient.actors().list({ 
        my: true,
        limit: 1000, // Increase limit to ensure we get all actors
        offset: 0
      })
      console.log('User actors response (my: true):', {
        total: userActors.total,
        count: userActors.count,
        itemsLength: userActors.items?.length || 0
      })
      
      if (userActors.items && userActors.items.length > 0) {
        actors = userActors.items.map((actor: any) => ({
          id: actor.id,
          name: actor.name,
          title: actor.title || actor.name,
          description: actor.description || 'No description available',
          isPublic: actor.isPublic || false,
          username: actor.username,
          stats: actor.stats,
          source: 'my-actors'
        }))
        console.log('Method 1 success: Found', actors.length, 'actors')
      }
    } catch (error) {
      console.error('Method 1 failed:', error)
    }
    
    // Method 2: If Method 1 didn't get all actors, try without my: true and filter
    if (actors.length < 6 && userInfo) {
      try {
        console.log('Method 2: Fetching all actors and filtering by username')
        const allActors = await apifyClient.actors().list({ 
          limit: 1000,
          offset: 0
        })
        
        console.log('All actors response:', {
          total: allActors.total,
          count: allActors.count,
          itemsLength: allActors.items?.length || 0
        })
        
        if (allActors.items) {
          const filteredActors = allActors.items.filter((actor: any) => 
            actor.username === userInfo.username
          )
          
          console.log('Found actors for user', userInfo.username + ':', filteredActors.length)
          
          if (filteredActors.length > actors.length) {
            actors = filteredActors.map((actor: any) => ({
              id: actor.id,
              name: actor.name,
              title: actor.title || actor.name,
              description: actor.description || 'No description available',
              isPublic: actor.isPublic || false,
              username: actor.username,
              stats: actor.stats,
              source: 'filtered-actors'
            }))
            console.log('Method 2 success: Found', actors.length, 'actors')
          }
        }
      } catch (error) {
        console.error('Method 2 failed:', error)
      }
    }
    
    // Method 3: Try getting more actors with pagination
    if (actors.length < 6) {
      try {
        console.log('Method 3: Trying pagination to find more actors')
        // Try with different offsets to get more actors
        for (let offset = 0; offset < 500; offset += 100) {
          const moreActors = await apifyClient.actors().list({
            my: true,
            limit: 100,
            offset: offset
          })
          
          if (moreActors.items && moreActors.items.length > 0) {
            const existingIds = new Set(actors.map(a => a.id))
            const newActors = moreActors.items
              .filter((actor: any) => !existingIds.has(actor.id))
              .map((actor: any) => ({
                id: actor.id,
                name: actor.name,
                title: actor.title || actor.name,
                description: actor.description || 'No description available',
                isPublic: actor.isPublic || false,
                username: actor.username,
                stats: actor.stats,
                source: 'paginated-actors'
              }))
            
            actors = [...actors, ...newActors]
            console.log('Method 3: Added', newActors.length, 'more actors from offset', offset, '. Total:', actors.length)
            
            // Stop if we found all 6 actors or no more actors
            if (actors.length >= 6 || moreActors.items.length < 100) {
              break
            }
          } else {
            break // No more actors
          }
        }
      } catch (error) {
        console.error('Method 3 failed:', error)
      }
    }

    // If no user actors, try to get public actors
    if (actors.length === 0) {
      try {
        // Get some popular public actors as fallback
        const publicActors = await apifyClient.actors().list({
          limit: 20
        })
        console.log('Public actors:', publicActors)
        
        if (publicActors.items && publicActors.items.length > 0) {
          actors = publicActors.items.map((actor: any) => ({
            id: actor.id,
            name: actor.name,
            title: actor.title || actor.name,
            description: actor.description || 'No description available',
            isPublic: true
          }))
        }
      } catch (error) {
        console.error('Error fetching public actors:', error)
      }
    }

    // If still no actors, add some well-known public actors manually
    if (actors.length === 0) {
      const popularActors = [
        { id: 'apify/web-scraper', name: 'web-scraper', title: 'Web Scraper', description: 'A versatile web scraper that can extract data from websites', isPublic: true },
        { id: 'apify/cheerio-scraper', name: 'cheerio-scraper', title: 'Cheerio Scraper', description: 'Fast HTML scraping with CSS selectors', isPublic: true },
        { id: 'apify/puppeteer-scraper', name: 'puppeteer-scraper', title: 'Puppeteer Scraper', description: 'Browser automation with JavaScript execution', isPublic: true },
        { id: 'apify/website-content-crawler', name: 'website-content-crawler', title: 'Website Content Crawler', description: 'Comprehensive website crawling', isPublic: true }
      ]
      
      actors = popularActors
      console.log('Using popular public actors as fallback')
    }

    if (actors.length === 0) {
      return NextResponse.json(
        { error: 'No actors found. Please check your API key and make sure you have access to actors.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ items: actors })
  } catch (error) {
    console.error('Error in actors route:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}