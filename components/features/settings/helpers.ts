import { DEFAULT_SETTINGS, STORAGE_KEY } from "./constants";
import type { SettingsState } from "./types";

export function loadSettingsFromStorage(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw) as SettingsState;

    if (parsed?.company && parsed?.banking) {
      return parsed;
    }

    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettingsToStorage(data: SettingsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function resetSettingsToDefault(): SettingsState {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
  } catch {
    // ignore
  }

  return DEFAULT_SETTINGS;
}

export function getSettingsTitle(tab: "company" | "banking") {
  return tab === "company" ? "Company Information" : "Banking Information";
}

export function getSettingsSubtitle(tab: "company" | "banking") {
  return tab === "company"
    ? "This information will appear on all generated documents"
    : "Used for invoices / quotations payment details";
}