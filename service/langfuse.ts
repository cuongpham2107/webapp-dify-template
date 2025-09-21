interface TracesParams {
  page?: number
  limit?: number
  userId?: string
  name?: string
  sessionId?: string
  fromTimestamp?: string
  toTimestamp?: string
  orderBy?: string
  tags?: string
  version?: string
  release?: string
  environment?: string
  fields?: string
}

interface TraceData {
  id: string
  timestamp: string
  name?: string
  userId?: string
  sessionId?: string
  version?: string
  release?: string
  environment?: string
  input?: any
  output?: any
  metadata?: any
  tags?: string[]
  level: string
  statusMessage?: string
  [key: string]: any
}

interface TracesResponse {
  data: TraceData[]
  meta: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export async function getTraces(params: TracesParams = {}): Promise<TracesResponse> {
  const baseUrl = process.env.LANGFUSE_BASE_URL
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY
  const secretKey = process.env.LANGFUSE_SECRET_KEY

  if (!baseUrl || !publicKey || !secretKey) {
    throw new Error('Langfuse configuration missing. Please check your environment variables.')
  }

  // Build query parameters
  const searchParams = new URLSearchParams()

  // Set default values
  const defaultParams = {
    page: 1,
    limit: 50,
    fromTimestamp: '2025-01-01T00:00:00Z',
    toTimestamp: '2025-09-20T23:59:59Z',
    ...params
  }

  Object.entries(defaultParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString())
    }
  })

  const url = `${baseUrl}/api/public/traces?${searchParams.toString()}`

  // Create Basic Auth header
  const credentials = Buffer.from(`${publicKey}:${secretKey}`).toString('base64')

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Langfuse API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error calling Langfuse API:', error)
    throw error
  }
}

// Convenience function with your specific parameters
export async function getTracesForUser(userId: string = 'user_c6917075-c848-49b7-a522-51d8316d29ea:cmf48lfus000iazi7ycxzb21g'): Promise<TracesResponse> {
  return getTraces({
    page: 1,
    limit: 50,
    userId,
    name: '',
    sessionId: '',
    fromTimestamp: '2025-01-01T00:00:00Z',
    toTimestamp: '2025-09-20T23:59:59Z',
    orderBy: '',
    tags: '',
    version: '',
    release: '',
    environment: '',
    fields: ''
  })
}