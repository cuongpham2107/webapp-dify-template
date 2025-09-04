import { API_KEY, API_URL } from '@/config'

export const fetchSuggestedQuestions = async (messageId: string): Promise<string[]> => {
    try {
        // Check if messageId is valid format for suggested questions
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)

        if (!isUUID) {
            return []
        }


        const response = await fetch(`/api/messages/${messageId}/suggested`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            return []
        }

        const data = await response.json()

        // Handle different response formats
        if (data.error) {
            return []
        }

        // Extract suggestions from response
        const suggestions = data.data || data.suggested_questions || []

        if (Array.isArray(suggestions)) {
            const validSuggestions = suggestions.filter(item =>
                typeof item === 'string' && item.trim().length > 0
            )

            if (validSuggestions.length > 0) {
            }

            return validSuggestions
        }

        return []

    } catch (error) {
        return []
    }
}