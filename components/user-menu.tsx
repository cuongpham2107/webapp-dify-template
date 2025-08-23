'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import { useAuth } from '@/hooks/use-auth'

export default function UserMenu() {
    const { t } = useTranslation()
    const { user, isAuthenticated, isLoading, session } = useAuth()
    const [isOpen, setIsOpen] = useState(false)

    // Always show something for debugging
    if (isLoading) {
        return (
            <div className="w-full p-3 border border-blue-200 bg-blue-50">
                <div className="text-xs text-blue-600">Loading auth...</div>
                <div className="flex items-center space-x-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <div className="w-full p-3 border border-red-200 bg-red-50">
                <div className="text-xs text-red-600">Not authenticated</div>
                <div className="text-xs text-gray-500 mt-1">
                    Session: {session ? 'exists' : 'null'}
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="w-full p-3 border border-yellow-200 bg-yellow-50">
                <div className="text-xs text-yellow-600">No user data</div>
                <div className="text-xs text-gray-500 mt-1">
                    Session: {JSON.stringify(session, null, 2)}
                </div>
            </div>
        )
    }

    const handleSignOut = () => {
        signOut({ callbackUrl: '/auth/login' })
    }

    return (
        <div className="relative w-full">
            <button
                type="button"
                className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-150 border border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Image
                    src={user.avatar}
                    alt={user.full_name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full ring-2 ring-gray-100"
                />
                <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{user.full_name}</div>
                    <div className="text-xs text-gray-500 truncate">{user.asgl_id}</div>
                </div>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-50 transform transition-all duration-200 ease-out">
                    {/* <div className="p-4 border-b border-gray-100">
                        <div className="flex items-start space-x-3">
                            <Image
                                src={user.avatar}
                                alt={user.full_name}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full ring-2 ring-blue-100"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 truncate">{user.full_name}</div>
                                <div className="text-sm text-blue-600 font-medium">{user.asgl_id}</div>
                                {user.positions.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                                        <div className="font-medium text-gray-700">{user.positions[0].name}</div>
                                        <div className="text-gray-500">{user.positions[0].department.name}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div> */}

                    <div className="">
                        {/* Logout option */}
                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center space-x-3"
                        >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-medium">{t('auth.logout.title')}</span>
                        </button>
                    </div>
                </div>
            )}            {/* Overlay to close dropdown */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    )
}
