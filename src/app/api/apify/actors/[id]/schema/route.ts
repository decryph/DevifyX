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
      // Get actor details using the Apify SDK
      const actorDetails = await apifyClient.actor(actorId).get()
      console.log('Full actor object:', JSON.stringify(actorDetails, null, 2));
      console.log('Actor inputSchema property:', actorDetails.inputSchema);
      
      let schema = null;
      
      // Method 1: Direct inputSchema check (some actors have it directly)
      if (actorDetails.inputSchema) {
        console.log('✅ Found inputSchema directly on actor object');
        schema = actorDetails.inputSchema;
      } else {
        console.log('❌ No inputSchema found directly on actor object');
        
        // Method 2: Deep search in versions.sourceFiles
        console.log('🔍 Searching for input_schema.json in versions.sourceFiles...');
        
        if (actorDetails.versions && actorDetails.versions.length > 0) {
          // Get the latest version or first available version
          const latestVersion = actorDetails.versions[0]; // Assuming versions are sorted by date
          console.log('📋 Checking version:', latestVersion.version);
          
          if (latestVersion.sourceFiles && latestVersion.sourceFiles.length > 0) {
            console.log('📁 Source files found:', latestVersion.sourceFiles.map(sf => sf.name));
            
            // Look for .actor/input_schema.json
            const inputSchemaFile = latestVersion.sourceFiles.find(
              (file: any) => file.name === '.actor/input_schema.json'
            );
            
            if (inputSchemaFile) {
              console.log('✅ Found .actor/input_schema.json file:', inputSchemaFile);
              
              try {
                // Attempt to JSON.parse the content
                if (inputSchemaFile.content) {
                  schema = JSON.parse(inputSchemaFile.content);
                  console.log('✅ Successfully parsed input_schema.json content');
                } else {
                  console.log('❌ input_schema.json file has no content');
                }
              } catch (parseError) {
                console.error('❌ Failed to parse input_schema.json:', parseError);
              }
            } else {
              console.log('❌ .actor/input_schema.json not found in source files');
            }
          } else {
            console.log('❌ No source files found in version');
          }
        } else {
          console.log('❌ No versions found on actor');
        }
      }
      
      if (!schema) {
        console.log('❌ No inputSchema found using any method');
        return NextResponse.json(
          { error: 'Actor does not have an input schema' },
          { status: 404 }
        )
      }

      console.log('🎉 Final extracted inputSchema:', JSON.stringify(schema, null, 2));
      return NextResponse.json({ schema })
    } catch (error) {
      console.error('Error fetching actor schema:', error)
      
      // For debugging, let's also log the actorId and error details
      console.log('Actor ID that caused error:', actorId);
      console.log('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      return NextResponse.json(
        { error: `Failed to fetch actor schema: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in schema route:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}