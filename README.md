# 🚀 DevifyX - Apify Integration Platform

A modern web application that demonstrates seamless integration with the Apify platform, featuring dynamic actor discovery, schema-based form generation, and real-time execution results.

## 🎯 Project Objective

This application showcases the ability to:
- Fetch available actors from Apify API
- Expose actor schemas dynamically at runtime
- Execute actor runs based on user-provided inputs
- Display results immediately with proper error handling

## ✨ Technology Stack

This application is built with:

### 🎯 Core Framework
- **⚡ Next.js 15** - The React framework for production with App Router
- **📘 TypeScript 5** - Type-safe JavaScript for better developer experience
- **🎨 Tailwind CSS 4** - Utility-first CSS framework for rapid UI development

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality, accessible components built on Radix UI
- **🎯 Lucide React** - Beautiful & consistent icon library
- **📋 Forms & Validation** - React Hook Form with Zod validation

### 🔄 API Integration
- **🌐 Apify SDK** - Official Apify client library for robust and secure API communication
- **🔐 Authentication** - Bearer token authentication for Apify API

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see the application running.

## 🎯 How to Use the Application

### 1. Authentication
- Enter your Apify API key in the authentication card
- Click "Connect" to fetch your available actors
- The application will validate your API key and retrieve your actor list
- <img width="1447" height="912" alt="image" src="https://github.com/user-attachments/assets/c0cc5d68-b379-42d7-9228-b0ebd4405a98" />


### 2. Actor Selection
- Choose an actor from the dropdown list
- The application will automatically fetch the actor's input schema
- Each actor displays its title and description for easy identification

### 3. Configuration
- The application dynamically generates a form based on the actor's input schema
- Fill in the required fields (marked with "Required" badge)
- The form supports various input types: text, numbers, booleans, enums, and arrays
- Each field includes helpful descriptions from the actor schema

### 4. Execution
- Click "Execute Actor" to run the selected actor with your inputs
- The application will monitor the execution status in real-time
- Results are displayed immediately upon completion

### 5. Results
- View execution status (SUCCEEDED, FAILED, TIMEOUT, etc.)
- See the execution ID for reference
- Browse the returned data in a formatted JSON view
- Error messages are displayed clearly if execution fails

## 🧪 Testing Actor

For testing purposes, this application works well with the following actors:

### Recommended Test Actor: **apify/web-scraper**
- **Description**: A versatile web scraper that can extract data from websites
- **Why it's good for testing**: 
  - Simple, well-defined input schema
  - Quick execution time
  - Demonstrates various input types (URLs, selectors, etc.)
  - Returns structured data that's easy to visualize

### Alternative Test Actors:
- **apify/cheerio-scraper**: Fast HTML scraping with CSS selectors
- **apify/puppeteer-scraper**: Browser automation with JavaScript execution
- **apify/website-content-crawler**: Comprehensive website crawling

## 🏗️ Architecture Overview

### Frontend Components
- **Authentication Card**: Handles API key input and validation
- **Actor Selection**: Dropdown populated with user's actors
- **Dynamic Form Generator**: Creates forms based on actor schemas
- **Results Display**: Shows execution status and data
- **Error Handling**: Toast notifications and inline error messages

### Backend API Routes
- **`/api/apify/actors`**: Fetches user's actors from Apify
- **`/api/apify/actors/[id]/schema`**: Retrieves actor input schema
- **`/api/apify/actors/[id]/execute`**: Executes actor with provided inputs

### Key Features
- **Dynamic Schema Loading**: No hardcoded schemas - everything fetched at runtime
- **Single-Run Execution**: Exactly one execution per request
- **Real-time Monitoring**: Polls Apify API for execution status
- **Comprehensive Error Handling**: Clear feedback for all failure scenarios
- **Type Safety**: Full TypeScript implementation

## 🔧 Technical Implementation

### Dynamic Form Generation
The application parses JSON schemas and generates appropriate form controls:
- **String fields**: Text inputs with password support
- **Number/Integer fields**: Numeric inputs
- **Boolean fields**: Dropdown with true/false options
- **Enum fields**: Dropdown with predefined options
- **Array fields**: Comma-separated text input

### API Communication
- **Apify SDK**: Official client library for robust API integration
- **Authentication**: Proper token-based authentication with error handling
- **Error Handling**: Comprehensive error messages and retry logic
- **Actor Management**: Automatic fallback to public actors when user actors unavailable

### Security Considerations
- API keys are transmitted securely via HTTPS
- No API keys are stored on the client side
- Input validation on both client and server
- Proper error messages without exposing sensitive information

## 🎨 Design Choices

### User Experience
- **Progressive Disclosure**: Only show relevant sections based on workflow
- **Loading States**: Clear indicators during API calls
- **Visual Feedback**: Toast notifications for user actions
- **Responsive Design**: Works on desktop and mobile devices

### Technical Decisions
- **Client-Side State**: Simple state management with React hooks
- **API-First Design**: Backend serves as a proxy to Apify API
- **Type Safety**: Full TypeScript implementation
- **Minimal Dependencies**: Uses existing stack where possible

## 🚀 Assumptions & Limitations

### Assumptions
1. Users have a valid Apify API key with appropriate permissions
2. Actors have well-defined input schemas
3. Network connectivity to Apify API is available
4. Execution completes within the timeout period (5 minutes)

### Limitations
1. **Timeout**: Actor execution is limited to 5 minutes
2. **No Persistence**: API keys and execution results are not stored
3. **Single User**: Designed for individual use, not multi-tenant
4. **Basic Authentication**: Only supports API key authentication

## 🔄 Future Enhancements

### Potential Improvements
- **Persistent Storage**: Save API keys securely (encrypted)
- **Execution History**: Track and display previous runs
- **Advanced Filtering**: Search and filter actors by category
- **Bulk Execution**: Run multiple actors sequentially
- **Webhook Support**: Receive real-time updates via webhooks
- **Export Results**: Download execution results in various formats

## 🤝 Contributing

This application serves as a demonstration of Apify integration capabilities. Feel free to extend it for your specific use cases or contribute improvements.

## 📄 License

This project is provided as-is for educational and demonstration purposes.

---

Built with ❤️ for the Apify Developer Challenge. Demonstrating modern web development with dynamic API integration.
