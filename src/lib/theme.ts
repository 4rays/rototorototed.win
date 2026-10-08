export type Theme = "light" | "dark" | "system";

export function getThemePreference(): Theme {
  if (typeof localStorage !== "undefined" && localStorage.getItem("theme")) {
    return localStorage.getItem("theme") as Theme;
  }

  // Dark by default — the Rototo scene only exists in dark
  return "dark";
}

export function setThemePreference(theme: Theme): void {
  if (theme === "system") {
    localStorage.removeItem("theme");
  } else {
    localStorage.setItem("theme", theme);
  }

  applyTheme(theme);
}

export function applyTheme(theme: Theme): void {
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList[isDark ? "add" : "remove"]("dark");
}
