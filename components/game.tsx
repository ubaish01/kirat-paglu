"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { OrbitControls, KeyboardControls, Stars } from "@react-three/drei";
import { GameScene } from "./game-scene";
import { GameOverlay } from "./game-overlay";
import { GameTimer } from "./game-timer";
import { ThemeToggle } from "./theme-toggle";

export default function Game() {
  const [gameState, setGameState] = useState<"playing" | "won" | "start">(
    "start"
  );
  const [username, setUsername] = useState<string>("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  // Simulate loading completion
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleGameWon = () => {
    if (startTime) {
      const endTime = Date.now();
      const timeTaken = endTime - startTime;
      setCompletionTime(timeTaken);
    }
    setGameState("won");
  };

  const startGame = (username: string) => {
    setUsername(username);
    setStartTime(Date.now());
    setCompletionTime(null);
    setGameState("playing");
  };

  const restartGame = () => {
    setStartTime(Date.now());
    setCompletionTime(null);
    setGameState("playing");
  };

  const toggleTheme = () => {
    setIsDarkTheme((prev) => !prev);
  };

  return (
    <div className={`w-full h-screen relative ${isDarkTheme ? "dark" : ""}`}>
      {/* Timer - Moved above the overlay to ensure it's visible */}
      {gameState === "playing" && startTime && (
        <GameTimer startTime={startTime} />
      )}

      {/* Theme Toggle - Always visible */}
      <ThemeToggle isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />

      <GameOverlay
        gameState={gameState}
        onStart={startGame}
        onRestart={restartGame}
        completionTime={completionTime || undefined}
        isDarkTheme={isDarkTheme}
      />

      {isLoading ? (
        // Simple loading indicator outside of Canvas
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-sky-100 dark:bg-slate-900">
          <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mb-4">
            Loading KiratPaglu Final Boss Challenge...
          </div>
          <div className="w-16 h-16 border-4 border-sky-600 dark:border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <KeyboardControls
          map={[
            { name: "forward", keys: ["ArrowUp", "KeyW"] },
            { name: "backward", keys: ["ArrowDown", "KeyS"] },
            { name: "left", keys: ["ArrowLeft", "KeyA"] },
            { name: "right", keys: ["ArrowRight", "KeyD"] },
          ]}
        >
          <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
            <fog attach="fog" args={["#87CEEB", 30, 500]} />
            <Stars radius={300} depth={50} count={5000} factor={4} />

            {gameState === "playing" && (
              <Physics>
                <GameScene
                  onGameWon={handleGameWon}
                  isDarkTheme={isDarkTheme}
                />
              </Physics>
            )}

            <OrbitControls enabled={false} makeDefault />
          </Canvas>
        </KeyboardControls>
      )}
    </div>
  );
}
