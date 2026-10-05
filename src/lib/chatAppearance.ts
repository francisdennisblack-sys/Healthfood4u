export type ChatAppearance = {
  theme: "original" | "mint" | "rose";
  density: "comfortable" | "compact";
  textSize: "standard" | "large";
  highlightedProductIds: string[];
  hiddenSections: string[];
};

export const hideableSections = ["hero", "benefits", "reviews", "profile"];
export const appearanceStorageKey = "healthfood4u_appearance";
export const defaultAppearance: ChatAppearance = {
  theme: "original", density: "comfortable", textSize: "standard", highlightedProductIds: [], hiddenSections: [],
};

export type AppearanceAction = {
  theme: ChatAppearance["theme"] | null;
  density: ChatAppearance["density"] | null;
  textSize: ChatAppearance["textSize"] | null;
  highlightedProductIds: string[] | null;
  hiddenSections: string[] | null;
  reset: boolean;
};

export function validateAppearanceAction(value: unknown, productIds: string[]): AppearanceAction {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid appearance action.");
  const action = Object.fromEntries(Object.entries(value).map(([key, entry]) => [
    key, key !== "reset" && entry === "null" ? null : entry,
  ]));
  const keys = ["theme", "density", "textSize", "highlightedProductIds", "hiddenSections", "reset"];
  if (Object.keys(action).length !== keys.length || Object.keys(action).some((key) => !keys.includes(key)) ||
    ![null, "original", "mint", "rose"].includes(action.theme as string | null) ||
    ![null, "comfortable", "compact"].includes(action.density as string | null) ||
    ![null, "standard", "large"].includes(action.textSize as string | null) || typeof action.reset !== "boolean") {
    throw new Error("Unsupported appearance settings.");
  }
  if (action.highlightedProductIds !== null && (!Array.isArray(action.highlightedProductIds) ||
    action.highlightedProductIds.length > 6 || action.highlightedProductIds.some((id) => typeof id !== "string" || !productIds.includes(id)))) {
    throw new Error("Choose up to six known products to highlight.");
  }
  if (action.hiddenSections !== null && (!Array.isArray(action.hiddenSections) ||
    action.hiddenSections.length > hideableSections.length || action.hiddenSections.some((section) => typeof section !== "string" || !hideableSections.includes(section)))) {
    throw new Error("Only optional promotional sections can be hidden.");
  }
  if (action.reset && keys.slice(0, -1).some((key) => action[key] !== null)) throw new Error("Reset cannot be combined with other settings.");
  if (!action.reset && keys.slice(0, -1).every((key) => action[key] === null)) throw new Error("No appearance change requested.");
  return action as AppearanceAction;
}

export function updateAppearance(current: ChatAppearance, action: AppearanceAction): ChatAppearance {
  if (action.reset) return { ...defaultAppearance, highlightedProductIds: [], hiddenSections: [] };
  return {
    theme: action.theme ?? current.theme,
    density: action.density ?? current.density,
    textSize: action.textSize ?? current.textSize,
    highlightedProductIds: action.highlightedProductIds === null ? current.highlightedProductIds : [...new Set(action.highlightedProductIds)],
    hiddenSections: action.hiddenSections === null ? current.hiddenSections : [...new Set(action.hiddenSections)],
  };
}

export function parseAppearance(stored: string): ChatAppearance {
  try {
    const parsed = JSON.parse(stored);
    const ids: unknown = parsed?.highlightedProductIds;
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 100)) return defaultAppearance;
    return updateAppearance(defaultAppearance, validateAppearanceAction({ ...parsed, hiddenSections: parsed.hiddenSections ?? [], reset: false }, ids));
  } catch {
    return defaultAppearance;
  }
}