export const DEFAULT_COLOR_THEME_ID = "default";

/** RGB triplets for Tailwind clinic-* (space-separated, no commas). */
export const COLOR_THEME_PALETTES = {
  default: {
    50: "244 248 251",
    100: "232 240 246",
    200: "209 225 237",
    300: "168 196 217",
    400: "129 162 197",
    500: "107 148 179",
    600: "86 122 148",
    700: "69 98 118",
    800: "58 81 98",
    900: "51 68 83",
  },
  emerald: {
    50: "236 253 245",
    100: "209 250 229",
    200: "167 243 208",
    300: "110 231 183",
    400: "52 211 153",
    500: "16 185 129",
    600: "5 150 105",
    700: "4 120 87",
    800: "6 95 70",
    900: "6 78 59",
  },
  teal: {
    50: "240 253 250",
    100: "204 251 241",
    200: "153 246 228",
    300: "94 234 212",
    400: "45 212 191",
    500: "20 184 166",
    600: "13 148 136",
    700: "15 118 110",
    800: "17 94 89",
    900: "19 78 74",
  },
  violet: {
    50: "245 243 255",
    100: "237 233 254",
    200: "221 214 254",
    300: "196 181 253",
    400: "167 139 250",
    500: "139 92 246",
    600: "124 58 237",
    700: "109 40 217",
    800: "91 33 182",
    900: "76 29 149",
  },
  rose: {
    50: "255 241 242",
    100: "255 228 230",
    200: "254 205 211",
    300: "253 164 175",
    400: "251 113 133",
    500: "244 63 94",
    600: "225 29 72",
    700: "190 18 60",
    800: "159 18 57",
    900: "136 19 55",
  },
};

export const COLOR_THEME_OPTIONS = [
  {
    id: "default",
    label: "Parazgjedhur",
    description: "Blu-gri — pamja aktuale e sistemit",
    swatch: "#567a94",
  },
  {
    id: "emerald",
    label: "Gjelbër",
    description: "Ton i freskët jeshil",
    swatch: "#059669",
  },
  {
    id: "teal",
    label: "Tirkiz",
    description: "Blu-jeshil i qetë",
    swatch: "#0d9488",
  },
  {
    id: "violet",
    label: "Vjollcë",
    description: "Theks vjollcë modern",
    swatch: "#7c3aed",
  },
  {
    id: "rose",
    label: "Rozë",
    description: "Theks rozë i ngrohtë",
    swatch: "#e11d48",
  },
];

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

export const DEFAULT_COLOR_THEME_PREFERENCES = {
  themeId: DEFAULT_COLOR_THEME_ID,
};

export function normalizeThemeId(themeId) {
  const id = String(themeId || DEFAULT_COLOR_THEME_ID).trim().toLowerCase();
  return COLOR_THEME_PALETTES[id] ? id : DEFAULT_COLOR_THEME_ID;
}

export function parseColorThemePreferences(source) {
  const p =
    source?.colorThemePreferences ??
    source?.ColorThemePreferences ??
    source ??
    {};
  const themeId = p.themeId ?? p.ThemeId ?? source?.colorTheme ?? source?.ColorTheme;
  return {
    themeId: normalizeThemeId(themeId),
  };
}

export function getThemeStorageKey(clinicId) {
  return `clinicops_color_theme_${clinicId || "unknown"}`;
}

export function readStoredThemeId(clinicId) {
  try {
    const raw = localStorage.getItem(getThemeStorageKey(clinicId));
    return raw ? normalizeThemeId(raw) : null;
  } catch {
    return null;
  }
}

export function writeStoredThemeId(clinicId, themeId) {
  try {
    localStorage.setItem(getThemeStorageKey(clinicId), normalizeThemeId(themeId));
  } catch {
    /* ignore */
  }
}

export function applyColorTheme(themeId) {
  const id = normalizeThemeId(themeId);
  const palette = COLOR_THEME_PALETTES[id];
  const root = document.documentElement;
  SHADES.forEach((shade) => {
    root.style.setProperty(`--color-clinic-${shade}`, palette[shade]);
  });
  root.dataset.clinicTheme = id;
}

export function applyColorThemeFromProfile(profile, clinicId) {
  const { themeId } = parseColorThemePreferences(profile);
  applyColorTheme(themeId);
  if (clinicId) writeStoredThemeId(clinicId, themeId);
  return themeId;
}

export function getThemePreviewColors(themeId) {
  const palette = COLOR_THEME_PALETTES[normalizeThemeId(themeId)];
  return {
    light: `rgb(${palette[100]})`,
    main: `rgb(${palette[600]})`,
    dark: `rgb(${palette[800]})`,
  };
}
