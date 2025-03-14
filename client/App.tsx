import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import 'phaser';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div 
      role="alert" 
      style={{
        padding: '20px',
        margin: '20px',
        border: '1px solid red',
        borderRadius: '4px',
        backgroundColor: '#fff8f8',
      }}
    >
      <h2>Something went wrong:</h2>
      <pre style={{ color: 'red' }}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function GameComponent() {
  React.useEffect(() => {
    // Initialize Phaser game
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      width: 800,
      height: 800,
      backgroundColor: '#ffffff',
      scene: {
        create() {
          // Game initialization code will go here
          const graphics = this.add.graphics();
          graphics.lineStyle(2, 0x00ff00);
          graphics.strokeRect(100, 100, 200, 150); // Meeting room
          graphics.strokeRect(400, 400, 150, 150); // Break room
        },
        update() {
          // Game update logic will go here
        },
      },
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div id="game" />;
}

export function App() {
  const handleError = (error: Error) => {
    // You can add additional error handling here
    console.error('Application error:', error);
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => {
        // Reset the game state when the user clicks "Try again"
        window.location.reload();
      }}
    >
      <div className="app-container">
        <GameComponent />
      </div>
    </ErrorBoundary>
  );
}
