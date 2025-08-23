export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'zh-Hans', 'ja', 'vi'],
} as const

export type Locale = typeof i18n['locales'][number]
