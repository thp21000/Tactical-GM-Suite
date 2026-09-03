import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useAppPreferences } from "../core/preferences/AppPreferencesProvider";
import dashboardEn from "../features/dashboard/i18n/en";
import dashboardFr from "../features/dashboard/i18n/fr";
import debugEn from "../features/debug/i18n/en";
import debugFr from "../features/debug/i18n/fr";
import initiativeEn from "../features/initiative/i18n/en";
import initiativeFr from "../features/initiative/i18n/fr";
import modulesEn from "../features/modules/i18n/en";
import modulesFr from "../features/modules/i18n/fr";
import rangeEn from "../features/range/i18n/en";
import rangeFr from "../features/range/i18n/fr";
import settingsEn from "../features/settings/i18n/en";
import settingsFr from "../features/settings/i18n/fr";
import statsEn from "../features/stats/i18n/en";
import statsFr from "../features/stats/i18n/fr";
import type {
  LocaleDictionary,
  TranslateFunction,
  TranslationParams,
} from "./types";

type I18nContextValue = {
  language: "fr" | "en";
  setLanguage: (language: "fr" | "en") => void;
  t: TranslateFunction;
};

const dictionaries: Record<"fr" | "en", LocaleDictionary> = {
  fr: {
    ...dashboardFr,
    ...debugFr,
    ...initiativeFr,
    ...modulesFr,
    ...rangeFr,
    ...settingsFr,
    ...statsFr,
  },
  en: {
    ...dashboardEn,
    ...debugEn,
    ...initiativeEn,
    ...modulesEn,
    ...rangeEn,
    ...settingsEn,
    ...statsEn,
  },
};

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;

  return template.replace(/\{(.*?)\}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language, setLanguage } = useAppPreferences();

  const t = useCallback<TranslateFunction>(
    (key, params) => {
      const template = dictionaries[language][key] ?? dictionaries.fr[key] ?? key;
      return interpolate(template, params);
    },
    [language],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }
  return context;
}
