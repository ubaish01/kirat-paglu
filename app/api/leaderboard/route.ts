import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Define the leaderboard entry type
type LeaderboardEntry = {
  username: string;
  time: number;
  date: any;
};

// Path to the leaderboard directory
const leaderboardDir = path.join(process.cwd(), "leaderboard");

// Ensure the leaderboard directory exists
const ensureLeaderboardDir = () => {
  if (!fs.existsSync(leaderboardDir)) {
    fs.mkdirSync(leaderboardDir, { recursive: true });
  }
};

// Get all leaderboard entries
export async function GET() {
  try {
    ensureLeaderboardDir();

    // Read all files in the leaderboard directory
    const files = fs.readdirSync(leaderboardDir);
    const entries: LeaderboardEntry[] = [];

    // Parse each file and add to entries
    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(leaderboardDir, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");

        try {
          const userData = JSON.parse(fileContent);

          // Get the best time for this user
          const bestEntry = userData.scores.reduce(
            (best: LeaderboardEntry | null, current: LeaderboardEntry) =>
              !best || current.time < best.time ? current : best,
            null
          );

          if (bestEntry) {
            entries.push(bestEntry);
          }
        } catch (error) {
          console.warn(`Skipping invalid JSON file: ${file}`);
          continue;
        }
      }
    }

    // Sort by fastest time
    const sortedEntries = entries.sort((a, b) => a.time - b.time);

    return NextResponse.json({ entries: sortedEntries });
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to get leaderboard" },
      { status: 500 }
    );
  }
}

// Save a new score
export async function POST(request: Request) {
  try {
    const { username, time } = await request.json();

    if (!username || !time) {
      return NextResponse.json(
        { error: "Username and time are required" },
        { status: 400 }
      );
    }

    ensureLeaderboardDir();

    // Sanitize username for filename
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_]/g, "_");
    const filePath = path.join(leaderboardDir, `${sanitizedUsername}.json`);

    // Create entry object
    const newEntry: LeaderboardEntry = {
      username,
      time,
      date: Date.now(),
    };

    // Check if file exists and update
    let userData = { scores: [] as LeaderboardEntry[] };

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      userData = JSON.parse(fileContent);
    }

    // Add new score
    userData.scores.push(newEntry);

    // Save updated data
    fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error) {
    console.error("Error saving score:", error);
    return NextResponse.json(
      { error: "Failed to save score" },
      { status: 500 }
    );
  }
}
