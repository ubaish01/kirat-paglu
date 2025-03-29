"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Trophy, Sparkles, Award, Star, ArrowRight } from "lucide-react";
import clsx from "clsx";

type GameOverlayProps = {
  gameState: "playing" | "won" | "start";
  onStart: (username: string) => void;
  onRestart: () => void;
  completionTime?: number;
  isDarkTheme?: boolean;
};

export function GameOverlay({
  gameState,
  onStart,
  onRestart,
  completionTime,
  isDarkTheme,
}: GameOverlayProps) {
  const [username, setUsername] = useState("");
  const [isAnimating, setIsAnimating] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hearts, setHearts] = useState<
    {
      id: number;
      x: number;
      y: number;
      size: number;
      speed: number;
      rotation: number;
    }[]
  >([]);

  // Format time in minutes and seconds
  const formatTime = (timeInMs: number) => {
    const totalSeconds = Math.floor(timeInMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Create floating hearts animation for the start screen
  useEffect(() => {
    if (gameState === "start" && isAnimating) {
      // Initialize hearts
      const newHearts = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 10 + Math.random() * 30,
        speed: 0.5 + Math.random() * 1.5,
        rotation: Math.random() * 360,
      }));

      setHearts(newHearts);

      // Animate hearts
      const interval = setInterval(() => {
        setHearts((prevHearts) =>
          prevHearts.map((heart) => ({
            ...heart,
            y: heart.y - heart.speed,
            rotation: heart.rotation + 0.5,
            // Reset if off screen
            ...(heart.y < -10 ? { y: 110, x: Math.random() * 100 } : {}),
          }))
        );
      }, 50);

      return () => clearInterval(interval);
    }
  }, [gameState, isAnimating]);

  // Create confetti effect when game is won
  useEffect(() => {
    if (gameState === "won") {
      setShowConfetti(true);
    } else {
      setShowConfetti(false);
    }
  }, [gameState]);

  if (gameState === "playing") return null;

  return (
    <div
      className={clsx(
        "absolute inset-0 flex items-center  justify-center z-10 backdrop-blur-sm",
        isDarkTheme ? "bg-[#000]" : "bg-[#fff]"
      )}
    >
      {/* Floating hearts for start screen */}
      {gameState === "start" &&
        hearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute pointer-events-none"
            style={{
              left: `${heart.x}%`,
              top: `${heart.y}%`,
              transform: `rotate(${heart.rotation}deg)`,
              transition: "top 0.5s linear, rotate 0.5s linear",
              zIndex: 5,
              opacity: 0.6,
            }}
          >
            <Heart
              fill={isDarkTheme ? "#ff6b8b" : "#ff4d6d"}
              color="transparent"
              size={heart.size}
            />
          </div>
        ))}

      {/* Confetti for win screen */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-5">
          {Array.from({ length: 100 }).map((_, i) => {
            const size = 5 + Math.random() * 15;
            const speed = 3 + Math.random() * 7;
            const rotation = Math.random() * 360;
            const delay = Math.random() * 2;
            const duration = 2 + Math.random() * 4;
            const type = Math.floor(Math.random() * 3);
            const color = [
              "#ff4d6d",
              "#ffb3c1",
              "#c9184a",
              "#ff8fa3",
              "#ffccd5",
              "#fff0f3",
              "#590d22",
              "#800f2f",
            ][Math.floor(Math.random() * 8)];

            return (
              <div
                key={i}
                className="absolute rounded-md"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-5%`,
                  width: `${size}px`,
                  height:
                    type === 0
                      ? `${size}px`
                      : type === 1
                      ? `${size * 0.5}px`
                      : `${size * 2}px`,
                  backgroundColor: color,
                  transform: `rotate(${rotation}deg)`,
                  animation: `confetti ${duration}s ease-out ${delay}s forwards`,
                  opacity: 0.8,
                }}
              />
            );
          })}
        </div>
      )}

      <style jsx global>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes shine {
          0% {
            background-position: -100px;
          }
          100% {
            background-position: 200px;
          }
        }

        .shine-effect {
          position: relative;
          overflow: hidden;
        }

        .shine-effect::after {
          content: "";
          position: absolute;
          top: -110%;
          left: -210%;
          width: 200%;
          height: 200%;
          opacity: 0;
          transform: rotate(30deg);
          background: rgba(255, 255, 255, 0.13);
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0.13) 0%,
            rgba(255, 255, 255, 0.13) 77%,
            rgba(255, 255, 255, 0.5) 92%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shine 5s infinite;
        }

        .heart-beat {
          animation: pulse 1.5s infinite ease-in-out;
        }

        .float-animation {
          animation: float 3s infinite ease-in-out;
        }
      `}</style>

      <div
        className={`${
          isDarkTheme
            ? "bg-slate-800/90 text-white"
            : "bg-white/90 text-slate-900"
        } p-8 rounded-lg shadow-2xl max-w-md text-center relative overflow-hidden`}
      >
        {gameState === "start" ? (
          <>
            <div className="relative mb-6 float-animation">
              <div className="absolute -top-1 -right-1">
                <Sparkles
                  className={`h-6 w-6 ${
                    isDarkTheme ? "text-pink-400" : "text-pink-500"
                  }`}
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <Heart
                  className={`h-8 w-8 ${
                    isDarkTheme ? "text-pink-400" : "text-pink-600"
                  } heart-beat`}
                  fill={isDarkTheme ? "#ec4899" : "#db2777"}
                />
                <h1
                  className={`text-4xl font-extrabold mb-1 ${
                    isDarkTheme
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400"
                      : "text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600"
                  }`}
                >
                  KiratPaglu
                </h1>
                <Heart
                  className={`h-8 w-8 ${
                    isDarkTheme ? "text-pink-400" : "text-pink-600"
                  } heart-beat`}
                  fill={isDarkTheme ? "#ec4899" : "#db2777"}
                />
              </div>
              <h2
                className={`text-xl font-bold ${
                  isDarkTheme ? "text-purple-300" : "text-purple-600"
                }`}
              >
                Final Boss Challenge
              </h2>
            </div>

            <div
              className={`p-4 mb-6 rounded-lg shine-effect ${
                isDarkTheme
                  ? "bg-gradient-to-r from-pink-900/40 to-purple-900/40 border border-pink-700/30"
                  : "bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200"
              }`}
            >
              <p className="font-medium mb-2">Prove you're Kirat's #1 fan!</p>
              <p
                className={`text-sm ${
                  isDarkTheme ? "text-pink-200" : "text-pink-700"
                }`}
              >
                Navigate through all obstacles to show your unwavering
                dedication. Your journey of fandom awaits!
              </p>
            </div>

            {/* Username input */}
            <div className="mb-5">
              <label
                htmlFor="username"
                className={`block text-sm font-medium ${
                  isDarkTheme ? "text-pink-300" : "text-pink-700"
                } mb-1 text-left`}
              >
                Your X (Twitter) Username:
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
                className={`w-full border-2 ${
                  isDarkTheme
                    ? "bg-slate-700/70 border-pink-700/50 text-white focus:border-pink-500"
                    : "border-pink-300 focus:border-pink-500"
                }`}
              />
            </div>

            <div
              className={`mb-5 p-3 rounded-lg ${
                isDarkTheme ? "bg-slate-700/50" : "bg-slate-100"
              }`}
            >
              <p className="font-semibold text-sm mb-1">Game Controls:</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                <div className="flex items-center">
                  <span
                    className={`inline-block px-2 py-1 rounded mr-2 ${
                      isDarkTheme
                        ? "bg-slate-600"
                        : "bg-white border border-slate-300"
                    }`}
                  >
                    ↑/W
                  </span>
                  <span>Move forward</span>
                </div>
                <div className="flex items-center">
                  <span
                    className={`inline-block px-2 py-1 rounded mr-2 ${
                      isDarkTheme
                        ? "bg-slate-600"
                        : "bg-white border border-slate-300"
                    }`}
                  >
                    ↓/S
                  </span>
                  <span>Slow down</span>
                </div>
                <div className="flex items-center">
                  <span
                    className={`inline-block px-2 py-1 rounded mr-2 ${
                      isDarkTheme
                        ? "bg-slate-600"
                        : "bg-white border border-slate-300"
                    }`}
                  >
                    ←/A
                  </span>
                  <span>Move left</span>
                </div>
                <div className="flex items-center">
                  <span
                    className={`inline-block px-2 py-1 rounded mr-2 ${
                      isDarkTheme
                        ? "bg-slate-600"
                        : "bg-white border border-slate-300"
                    }`}
                  >
                    →/D
                  </span>
                  <span>Move right</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => onStart(username)}
              className={`w-full py-3 text-base font-bold relative overflow-hidden shine-effect ${
                isDarkTheme
                  ? "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  : "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              }`}
              disabled={!username.trim()}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Start Challenge <ArrowRight className="h-5 w-5" />
              </span>
            </Button>
          </>
        ) : (
          <>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500"></div>

            <div className="flex justify-center mb-2">
              <div
                className={`p-3 rounded-full ${
                  isDarkTheme ? "bg-pink-700/40" : "bg-pink-100"
                }`}
              >
                <Trophy
                  className={`h-8 w-8 ${
                    isDarkTheme ? "text-yellow-300" : "text-yellow-500"
                  }`}
                />
              </div>
            </div>

            <h1
              className={`text-3xl font-extrabold mb-2 ${
                isDarkTheme ? "text-pink-300" : "text-pink-600"
              }`}
            >
              True Fan Status: Achieved!
            </h1>

            <div className="relative mb-6">
              <div
                className={`px-4 py-3 mb-2 rounded-lg ${
                  isDarkTheme ? "bg-slate-700/50" : "bg-slate-100"
                }`}
              >
                <p className="mb-2 font-medium">
                  You've conquered the KiratPaglu Final Boss Challenge!
                </p>
                <p className="text-sm">
                  Your dedication to Kirat is unmatched and you've earned your
                  place as a true superfan!
                </p>
              </div>

              <div className="flex justify-center gap-2 mt-4 mb-2">
                <Star fill="#FFD700" color="transparent" className="h-5 w-5" />
                <Star fill="#FFD700" color="transparent" className="h-5 w-5" />
                <Star fill="#FFD700" color="transparent" className="h-5 w-5" />
                <Star fill="#FFD700" color="transparent" className="h-5 w-5" />
                <Star fill="#FFD700" color="transparent" className="h-5 w-5" />
              </div>

              <div className="text-center mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Elite Fan Score
                </span>
              </div>
            </div>

            {/* Show completion time */}
            {completionTime && (
              <div
                className={`mb-6 p-4 ${
                  isDarkTheme ? "bg-pink-900/30" : "bg-pink-50"
                } rounded-md border-2 ${
                  isDarkTheme ? "border-pink-700/50" : "border-pink-200"
                }`}
              >
                <p
                  className={`text-sm ${
                    isDarkTheme ? "text-pink-300" : "text-pink-700"
                  }`}
                >
                  Your amazing time:
                </p>
                <p
                  className={`text-3xl font-bold ${
                    isDarkTheme ? "text-pink-300" : "text-pink-600"
                  }`}
                >
                  {formatTime(completionTime)}
                </p>

                <div className="flex items-center justify-center gap-1 mt-2">
                  <Award
                    className={`h-5 w-5 ${
                      isDarkTheme ? "text-yellow-300" : "text-yellow-500"
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      isDarkTheme ? "text-yellow-300" : "text-yellow-600"
                    }`}
                  >
                    Kirat's Certified Superfan
                  </p>
                </div>
              </div>
            )}

            <div
              className={`p-4 mb-6 rounded-lg border ${
                isDarkTheme
                  ? "bg-slate-700/50 border-slate-600"
                  : "bg-white border-slate-200"
              }`}
            >
              <p className="font-medium mb-2">Share your achievement!</p>
              <p className="text-sm mb-3">
                You've won a follow back from yr_hexadecimal. Post this
                achievement or DM to get a follow on X (Twitter).
              </p>

              <div
                className={`p-3 rounded text-sm mb-2 text-left ${
                  isDarkTheme ? "bg-slate-800" : "bg-slate-100"
                }`}
              >
                <code>
                  Just beat the KiratPaglu Final Boss Challenge in{" "}
                  {completionTime ? formatTime(completionTime) : "record time"}!
                  Officially Kirat's biggest fan 🏆 @yr_hexadecimal
                  #KiratPagluChallenge
                </code>
              </div>
            </div>

            <Button
              onClick={onRestart}
              className={`w-full py-3 text-base font-bold ${
                isDarkTheme
                  ? "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  : "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              }`}
            >
              Play Again
            </Button>
          </>
        )}
      </div>

      <div className="flex absolute bottom-10 flex-col items-center justify-center">
        <p className="text-sm sm:text-base">
          <span
            className={clsx(" font-medium", isDarkTheme ? "text-white" : "")}
          >
            Made with Lust by{" "}
          </span>
          <a
            href="https://twitter.com/yr_hexadecimal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00D1FF] transition-colors font-bold"
          >
            Hexadecimal
          </a>
        </p>
        <p className="text-xs text-[#A1A1AA] mt-1">
          Follow on Twitter for more crazy stuff
        </p>
      </div>
    </div>
  );
}
