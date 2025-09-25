# Manga Studio AI - مصنع المانغا بالذكاء الاصطناعي

## Overview
A React + TypeScript web application for AI-powered manga creation using Google Gemini API. The app provides tools for generating manga story outlines, panel descriptions, dialogue, and images through AI assistance.

## Recent Changes
- **2025-09-25**: Initial Replit environment setup
  - Configured Vite dev server to run on port 5000 with proper host configuration
  - Installed all Node.js dependencies
  - Set up development workflow for automatic server startup
  - Configured deployment settings for production builds
  - Created environment variable setup for Gemini API key

## Project Architecture
- **Frontend**: React 19 with TypeScript, using Vite as build tool
- **Styling**: Tailwind CSS (loaded via CDN with custom configuration)
- **State Management**: Zustand for global state
- **Routing**: React Router DOM v7 with hash routing
- **AI Integration**: Google Gemini API (@google/genai)
- **Database**: IndexedDB for browser-based storage
- **UI Components**: Custom components with Radix UI primitives

## Key Features
- Dashboard for manga project management
- AI-powered story generation and continuation
- Character and world building tools
- Visual manga panel editor
- Story memory and graph visualization
- Multi-language support (Arabic/English)

## Development Setup
- Server runs on port 5000 (configured for Replit environment)
- Environment variables managed through `.env.local`
- Workflow automatically starts development server
- Deployment configured for static build with preview server

## User Preferences
- No specific coding preferences documented yet
- Project follows React/TypeScript best practices
- Uses functional components with hooks
- Maintains clean component structure in organized directories