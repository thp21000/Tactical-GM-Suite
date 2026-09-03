export type LocaleDictionary = Record<string, string>;

export type TranslationParams = Record<string, string | number>;

export type TranslateFunction = (
  key: string,
  params?: TranslationParams,
) => string;
