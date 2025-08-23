'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/i18next-config'
import { getLocaleOnClient } from '@/i18n/client'

type Props = {
    children: ReactNode
}

export default function I18nProvider({ children }: Props) {
    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        if (!initialized) {
            // Initialize with the client locale
            const locale = getLocaleOnClient()
            i18n.changeLanguage(locale).then(() => {
                setInitialized(true)
            })
        }
    }, [initialized])

    return (
        <I18nextProvider i18n={i18n}>
            {children}
        </I18nextProvider>
    )
}
