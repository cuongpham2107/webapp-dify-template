'use client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import commonEn from './lang/common.en'
import commonVi from './lang/common.vi'
import appEn from './lang/app.en'
import appVi from './lang/app.vi'
import authVi from './lang/auth.vi'
import authEn from './lang/auth.en'
import toolsEn from './lang/tools.en'
import toolsVi from './lang/tools.vi'

import type { Locale } from '.'

const resources = {
  en: {
    translation: {
      common: commonEn,
      app: appEn,
      // tools
      tools: toolsEn,
      auth: authEn,
    },
  },
  vi: {
    translation: {
      common: commonVi,
      app: appVi,
      // tools
      tools: toolsVi,
      auth: authVi,
    },
  },
}

i18n.use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    lng: 'en',
    fallbackLng: 'en',
    // debug: true,
    resources,
  })

export const changeLanguage = (lan: Locale) => {
  i18n.changeLanguage(lan)
}
export default i18n
