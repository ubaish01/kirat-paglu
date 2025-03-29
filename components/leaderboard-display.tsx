// src/components/leaderboard-display.tsx
"use client";

import { useState, useEffect } from "react";
import { Trophy, User, Clock } from "lucide-react";
import clsx from "clsx";
import { format } from "timeago.js";

type LeaderboardEntry = {
  username: string;
  time: number;
  date: string;
};

type LeaderboardProps = {
  isDarkTheme: boolean;
};

export function LeaderboardDisplay({ isDarkTheme }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format time in minutes and seconds
  const formatTime = (timeInMs: number) => {
    const totalSeconds = Math.floor(timeInMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/leaderboard");

        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard");
        }

        const data = await response.json();
        setEntries(data.entries || []);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError("Could not load leaderboard. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse flex justify-center items-center space-x-2 py-4">
        <Trophy
          className={`h-5 w-5 ${
            isDarkTheme ? "text-yellow-300" : "text-yellow-500"
          }`}
        />
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {entries.length === 0 ? (
        <div className="text-center py-4">
          <p className={`${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
            No entries yet. Be the first to complete the challenge!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className={`${
                  isDarkTheme ? "text-gray-300" : "text-gray-600"
                } text-xs border-b ${
                  isDarkTheme ? "border-gray-700" : "border-gray-300"
                }`}
              >
                <th className="px-2 py-2 text-left">Rank</th>
                <th className="px-2 py-2 text-left">
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    <span>Username</span>
                  </div>
                </th>
                <th className="px-2 py-2 text-left">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Time</span>
                  </div>
                </th>
                <th className="px-2 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr
                  key={`${entry.username}-${index}`}
                  className={clsx(
                    "text-sm",
                    index === 0 &&
                      `font-bold ${
                        isDarkTheme ? "bg-yellow-700/20" : "bg-yellow-50"
                      }`,
                    index === 1 &&
                      `${isDarkTheme ? "bg-gray-600/20" : "bg-gray-50"}`,
                    index === 2 &&
                      `${isDarkTheme ? "bg-amber-800/20" : "bg-amber-50"}`
                  )}
                >
                  <td className="px-2 py-2">
                    {index === 0 && "🥇"}
                    {index === 1 && "🥈"}
                    {index === 2 && "🥉"}
                    {index > 2 && `#${index + 1}`}
                  </td>
                  <td className="px-2 py-2">{entry.username}</td>
                  <td className="px-2 py-2 font-mono">
                    {formatTime(entry.time)}
                  </td>
                  <td className="px-2 py-2 text-xs opacity-80">
                    {format(entry.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
