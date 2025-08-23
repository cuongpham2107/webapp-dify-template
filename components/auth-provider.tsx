'use client'

import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'
import I18nProvider from './i18n-provider'

type Props = {
    children: ReactNode
}

export default function AuthProvider({ children }: Props) {
    return (
        <I18nProvider>
            <SessionProvider>{children}</SessionProvider>
        </I18nProvider>
    )
}
