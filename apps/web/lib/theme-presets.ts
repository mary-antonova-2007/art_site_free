export type ThemePreset = {
  id: string;
  name: string;
  group: string;
};

export type ThemeColorToken = {
  field: string;
  label: string;
  cssVar: `--${string}`;
};

export type ThemeTokenValues = Record<string, string>;

export const defaultThemeId = "cool-mist";

export const themePresets: ThemePreset[] = [
  { id: "cool-mist", name: "Mist", group: "Pastel Cool" },
  { id: "cool-fjord", name: "Fjord", group: "Pastel Cool" },
  { id: "cool-glacier", name: "Glacier", group: "Pastel Cool" },
  { id: "cool-lilac", name: "Lilac", group: "Pastel Cool" },
  { id: "warm-peach", name: "Peach", group: "Pastel Warm" },
  { id: "warm-apricot", name: "Apricot", group: "Pastel Warm" },
  { id: "warm-honey", name: "Honey", group: "Pastel Warm" },
  { id: "warm-rose", name: "Rose", group: "Pastel Warm" },
  { id: "light-coral", name: "Coral Accent", group: "Light" },
  { id: "light-sage", name: "Sage Accent", group: "Light" },
  { id: "light-cobalt", name: "Cobalt Accent", group: "Light" },
  { id: "light-gold", name: "Gold Accent", group: "Light" },
  { id: "dark-ember", name: "Ember Accent", group: "Dark" },
  { id: "dark-emerald", name: "Emerald Accent", group: "Dark" },
  { id: "dark-sapphire", name: "Sapphire Accent", group: "Dark" },
  { id: "dark-plum", name: "Plum Accent", group: "Dark" }
];

export const themePresetIds = new Set(themePresets.map((theme) => theme.id));

export const themeColorTokens: ThemeColorToken[] = [
  { field: "paper", label: "Paper", cssVar: "--paper" },
  { field: "paperStrong", label: "Paper Strong", cssVar: "--paper-strong" },
  { field: "ink", label: "Text", cssVar: "--ink" },
  { field: "muted", label: "Muted Text", cssVar: "--muted" },
  { field: "accent", label: "Accent", cssVar: "--accent" },
  { field: "editor", label: "Deep Accent", cssVar: "--editor" },
  { field: "surfacePanel", label: "Panel", cssVar: "--surface-panel" },
  { field: "surfaceRaised", label: "Raised Surface", cssVar: "--surface-raised" },
  { field: "surfaceElevated", label: "Elevated Surface", cssVar: "--surface-elevated" },
  { field: "line", label: "Border", cssVar: "--line" }
];

export const themeTokenValuesByTheme: Record<string, ThemeTokenValues> = {
  "cool-mist": {
    paper: "#eef4f3",
    paperStrong: "#dde9e7",
    ink: "#182228",
    muted: "#61747a",
    accent: "#5d8fa3",
    editor: "#1f4854",
    surfacePanel: "#eef4f3",
    surfaceRaised: "#f7fbfb",
    surfaceElevated: "#fdffff",
    line: "#d0dad8"
  },
  "cool-fjord": {
    paper: "#edf2f8",
    paperStrong: "#dde5f0",
    ink: "#182234",
    muted: "#63738e",
    accent: "#5e7fc4",
    editor: "#213b64",
    surfacePanel: "#edf2f8",
    surfaceRaised: "#f7f9fd",
    surfaceElevated: "#fcfeff",
    line: "#cfd8e6"
  },
  "cool-glacier": {
    paper: "#eef6fa",
    paperStrong: "#dcedf3",
    ink: "#14262d",
    muted: "#5e7d88",
    accent: "#4e9cbc",
    editor: "#1b5364",
    surfacePanel: "#eef6fa",
    surfaceRaised: "#f8fcfd",
    surfaceElevated: "#fdffff",
    line: "#cedfe6"
  },
  "cool-lilac": {
    paper: "#f2f0f8",
    paperStrong: "#e4deef",
    ink: "#221b2d",
    muted: "#746a86",
    accent: "#8f79bb",
    editor: "#4c3c6e",
    surfacePanel: "#f2f0f8",
    surfaceRaised: "#faf8fd",
    surfaceElevated: "#fffaff",
    line: "#d8d0e5"
  },
  "warm-peach": {
    paper: "#faf0ea",
    paperStrong: "#f1ddd1",
    ink: "#2f1d18",
    muted: "#8a695d",
    accent: "#d88b68",
    editor: "#7d4d38",
    surfacePanel: "#faf0ea",
    surfaceRaised: "#fef8f5",
    surfaceElevated: "#fffaf8",
    line: "#e4cfc4"
  },
  "warm-apricot": {
    paper: "#f9f1e7",
    paperStrong: "#efdfcd",
    ink: "#2e2116",
    muted: "#8b7155",
    accent: "#d59b56",
    editor: "#795734",
    surfacePanel: "#f9f1e7",
    surfaceRaised: "#fdf8f2",
    surfaceElevated: "#fffcf7",
    line: "#e3d4c0"
  },
  "warm-honey": {
    paper: "#f8f2df",
    paperStrong: "#ede2ba",
    ink: "#2f2710",
    muted: "#887644",
    accent: "#c8a229",
    editor: "#6f5a16",
    surfacePanel: "#f8f2df",
    surfaceRaised: "#fcf8eb",
    surfaceElevated: "#fffdf5",
    line: "#e2d7ab"
  },
  "warm-rose": {
    paper: "#f8ecec",
    paperStrong: "#efd9da",
    ink: "#301b22",
    muted: "#8a626d",
    accent: "#c87b8f",
    editor: "#7b4152",
    surfacePanel: "#f8ecec",
    surfaceRaised: "#fdf7f8",
    surfaceElevated: "#fffbfc",
    line: "#e4ced1"
  },
  "light-coral": {
    paper: "#f7f2ee",
    paperStrong: "#ecdfd8",
    ink: "#1d1a1c",
    muted: "#6d6266",
    accent: "#d05852",
    editor: "#7a2e34",
    surfacePanel: "#f7f2ee",
    surfaceRaised: "#fcf8f5",
    surfaceElevated: "#fffdfa",
    line: "#ddd2cc"
  },
  "light-sage": {
    paper: "#f1f4ed",
    paperStrong: "#e0e7d9",
    ink: "#1a221c",
    muted: "#667264",
    accent: "#728e58",
    editor: "#41573d",
    surfacePanel: "#f1f4ed",
    surfaceRaised: "#f8fbf6",
    surfaceElevated: "#fdfffc",
    line: "#d0d8cc"
  },
  "light-cobalt": {
    paper: "#eef4fb",
    paperStrong: "#dbe6f5",
    ink: "#162032",
    muted: "#607190",
    accent: "#3e72d9",
    editor: "#22468d",
    surfacePanel: "#eef4fb",
    surfaceRaised: "#f7faff",
    surfaceElevated: "#fcfeff",
    line: "#ced9e8"
  },
  "light-gold": {
    paper: "#f7f3e8",
    paperStrong: "#ece2c8",
    ink: "#252013",
    muted: "#7a6d49",
    accent: "#b68a17",
    editor: "#6e5413",
    surfacePanel: "#f7f3e8",
    surfaceRaised: "#fcf9ef",
    surfaceElevated: "#fffdf7",
    line: "#ddd5c0"
  },
  "dark-ember": {
    paper: "#171312",
    paperStrong: "#241c1b",
    ink: "#f3ede7",
    muted: "#c0b0a7",
    accent: "#f07c57",
    editor: "#ffd4c5",
    surfacePanel: "#1c1615",
    surfaceRaised: "#231c1b",
    surfaceElevated: "#2b2120",
    line: "#4b3d3a"
  },
  "dark-emerald": {
    paper: "#101715",
    paperStrong: "#1b2522",
    ink: "#edf4f0",
    muted: "#a8bbb2",
    accent: "#45bb86",
    editor: "#c9f3de",
    surfacePanel: "#151d1b",
    surfaceRaised: "#1b2522",
    surfaceElevated: "#202b27",
    line: "#3b5049"
  },
  "dark-sapphire": {
    paper: "#0f1520",
    paperStrong: "#1a2434",
    ink: "#edf2fb",
    muted: "#aab6d3",
    accent: "#4a8dff",
    editor: "#c8dcff",
    surfacePanel: "#141d2a",
    surfaceRaised: "#1a2434",
    surfaceElevated: "#1f2b3e",
    line: "#38465e"
  },
  "dark-plum": {
    paper: "#17111b",
    paperStrong: "#251b2d",
    ink: "#f4eef8",
    muted: "#c2b1cc",
    accent: "#c26df0",
    editor: "#ebcafb",
    surfacePanel: "#1c1523",
    surfaceRaised: "#251b2d",
    surfaceElevated: "#2c2035",
    line: "#493952"
  }
};

export function getThemeTokenValues(themeId: string) {
  return themeTokenValuesByTheme[themeId] ?? themeTokenValuesByTheme[defaultThemeId];
}
