import { useSyncExternalStore } from "react";

export const themes = [
  { id: "navy", name: "Navy", color: "#174d91" },
  { id: "ocean", name: "Ocean", color: "#0d9488" },
  { id: "dark", name: "Dark", color: "#08111f" },
] as const;
export type ThemeId = (typeof themes)[number]["id"];
const themeKey = "crm-theme";
let fallback: ThemeId = "navy";

function getTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(themeKey);
    if (saved === "light") {
      localStorage.setItem(themeKey, "dark");
      return "dark";
    }
    return themes.find((theme) => theme.id === saved)?.id ?? fallback;
  } catch { return fallback; }
}
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("crm-theme-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("crm-theme-change", onChange);
  };
}
export function useCRMTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "navy" as ThemeId);
  function setTheme(value: ThemeId) {
    fallback = value;
    try { localStorage.setItem(themeKey, value); } catch { /* Keep the choice for this session. */ }
    window.dispatchEvent(new Event("crm-theme-change"));
  }
  return [theme, setTheme] as const;
}
