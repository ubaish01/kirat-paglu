"use client";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

type ThemeToggleProps = {
  isDarkTheme: boolean;
  toggleTheme: () => void;
};

export function ThemeToggle({ isDarkTheme, toggleTheme }: ThemeToggleProps) {
  return (
    <div className="absolute top-4 right-4 z-20 bg-black/70 text-white px-4 py-2 rounded-md flex items-center gap-2">
      <Sun className="h-4 w-4" />
      <Switch
        checked={isDarkTheme}
        onCheckedChange={toggleTheme}
        className="data-[state=checked]:bg-blue-600"
      />
      <Moon className="h-4 w-4" />
    </div>
  );
}
