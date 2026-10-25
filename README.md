# HealthyPaws — Pet Health App

HealthyPaws is a pet health management application designed to help owners organize information about their pets and manage their care.

## Features

- User registration and authentication
- Pet profiles and pet information management
- Pet pedigree visualization
- Medication and care-related screens
- AI-assisted pet-related questions
- Pet recognition and QR-related functionality
- PostgreSQL database integration

Some features may require additional backend configuration or external API credentials.

## Tech Stack

### Frontend
- React Native
- Expo
- TypeScript
- React Context API

### Backend
- Node.js
- Express
- PostgreSQL
- JWT authentication

### External Services
- Supabase-hosted PostgreSQL
- Google Gemini API for AI-related functionality

## Project Structure

- `App.tsx` — application entry point
- `components/` — user interface components
- `src/` — application services, hooks, types, and utilities
- `backend/` — API server, database configuration, routes, and controllers
- `assets/` — images, icons, and fonts
- `web/` — web-related files

## Requirements

- Node.js and npm
- Expo-compatible development environment
- PostgreSQL database or Supabase PostgreSQL connection
- API credentials for features that use external services

## Setup

### Frontend

From the project root:

    npm install
    npm start

### Backend

Configure the required environment variables in `backend/.env`. Use `backend/.env.example` as a template when available. Never commit real credentials.

Then run:

    cd backend
    npm install
    npm run dev

Start the frontend and backend in separate terminals.

## Security

- Keep `.env` files and private credentials out of version control.
- Use environment variables for passwords and API keys.
- Never publish database passwords, JWT secrets, or private API keys.

## Project Status

This project is under active development. Feature availability depends on the current implementation and configuration.
