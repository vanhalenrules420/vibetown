# Vibe Town

A multiplayer social space built with Phaser, Colyseus, and Firebase. Players can move around in a virtual office environment, interact with others, and use various office spaces like meeting rooms and break areas.

## Features

- Real-time multiplayer interaction using Colyseus
- Custom office layout with designated areas (meeting rooms, break rooms)
- Player movement and collision detection
- Firebase integration for authentication and data persistence
- Error handling with React Error Boundary
- Comprehensive logging with Winston

## Tech Stack

- **Frontend**: React, Phaser 3
- **Backend**: Colyseus, Firebase Functions
- **State Management**: Colyseus Schema
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Logging**: Winston
- **Development**: TypeScript, ESLint (Airbnb config)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Access the game at `http://localhost:2570/game`

## Project Structure

- `/client`: React and Phaser game client code
- `/server`: Colyseus server and game state management
- `/firebase/functions`: Firebase Cloud Functions
- `/tests`: Test files

## Development

- Run linting: `npm run lint`
- Fix linting issues: `npm run lint:fix`
- Deploy Firebase functions: `npm run deploy:functions`
