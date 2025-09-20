/**
 * Formats a number with comma separators.
 * @example formatNumber(1234567) will return '1,234,567'
 * @example formatNumber(1234567.89) will return '1,234,567.89'
 */
export const formatNumber = (num: number | string) => {
  if (!num)
    return num
  const parts = num.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

/**
 * Format file size into standard string format.
 * @param fileSize file size (Byte)
 * @example formatFileSize(1024) will return '1.00KB'
 * @example formatFileSize(1024 * 1024) will return '1.00MB'
 */
export const formatFileSize = (fileSize: number) => {
  if (!fileSize)
    return fileSize
  const units = ['', 'K', 'M', 'G', 'T', 'P']
  let index = 0
  while (fileSize >= 1024 && index < units.length) {
    fileSize = fileSize / 1024
    index++
  }
  return `${fileSize.toFixed(2)}${units[index]}B`
}

/**
 * Format time into standard string format.
 * @example formatTime(60) will return '1.00 min'
 * @example formatTime(60 * 60) will return '1.00 h'
 */
export const formatTime = (seconds: number) => {
  if (!seconds)
    return seconds
  const units = ['sec', 'min', 'h']
  let index = 0
  while (seconds >= 60 && index < units.length) {
    seconds = seconds / 60
    index++
  }
  return `${seconds.toFixed(2)} ${units[index]}`
}

export const downloadFile = ({ data, fileName }: { data: Blob; fileName: string }) => {
  const url = window.URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

/**
 * Format timestamp to readable date-time string.
 * @param timestamp Unix timestamp (seconds)
 * @example formatDateTime(1758289698) will return '20/09/2025 14:30'
 */
export const formatDateTime = (timestamp: number) => {
  if (!timestamp) return ''

  const date = new Date(timestamp * 1000) // Convert seconds to milliseconds

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}`
}

/**
 * Format timestamp to relative time string (e.g. "2 minutes ago", "1 hour ago")
 * @param timestamp Unix timestamp (seconds)
 * @example formatRelativeTime(Date.now()/1000 - 300) will return '5 phút trước'
 */
export const formatRelativeTime = (timestamp: number) => {
  if (!timestamp) return ''

  const now = Date.now() / 1000 // Current time in seconds
  const diff = now - timestamp // Difference in seconds

  if (diff < 60) {
    return 'Vừa xong'
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60)
    return `${minutes} phút trước`
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return `${hours} giờ trước`
  } else if (diff < 2592000) {
    const days = Math.floor(diff / 86400)
    return `${days} ngày trước`
  } else {
    // For older messages, show full date
    return formatDateTime(timestamp)
  }
}
