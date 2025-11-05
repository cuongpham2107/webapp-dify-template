'use client'
import type { FC } from 'react'
import React, { useState, useEffect } from 'react'
import { downloadAndSaveCitation } from '@/lib/api/citations'
import { ThumbsUp, ThumbsDown, Loader, Edit, Volume2, Heart, X, Eye, RotateCcw, Zap, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LoadingAnim from '../loading-anim'
import type { FeedbackFunc } from '../type'
import s from '../style.module.css'
import ImageGallery from '../../base/image-gallery'
import Thought from '../thought'
import { randomString } from '@/utils/string'
import type { MessageRating, VisionFile } from '@/types/app'
import type { IChatItem, CitationItem } from '../type'
import Tooltip from '@/app/components/base/tooltip'
import WorkflowProcess from '@/app/components/workflow/workflow-process'
import { Markdown } from '@/app/components/base/markdown'
import Button from '@/app/components/base/button'
import type { Emoji } from '@/types/tools'
import { ArrowDownToLine, File, FileDownIcon, FileText } from 'lucide-react'
import { checkDocumentAccess, convertTextToAudio } from '@/service'
import { formatRelativeTime } from '@/utils/format'
import Toast from '@/app/components/base/toast'

const OperationBtn = ({ innerContent, onClick, className }: { innerContent: React.ReactNode; onClick?: () => void; className?: string }) => (
  <div
    className={`relative box-border flex items-center justify-center h-7 w-7 p-0.5 rounded-lg bg-white cursor-pointer text-gray-500 hover:text-gray-800 ${className ?? ''}`}
    style={{ boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)' }}
    onClick={onClick && onClick}
  >
    {innerContent}
  </div>
)

const OpeningStatementIcon: FC<{ className?: string }> = ({ className }) => (
  <Heart className={`w-3 h-3 text-gray-500 ${className}`} />
)

const RatingIcon: FC<{ isLike: boolean }> = ({ isLike }) => {
  return isLike ? <ThumbsUp className='w-4 h-4' /> : <ThumbsDown className='w-4 h-4' />
}

const EditIcon: FC<{ className?: string }> = ({ className }) => {
  return <Edit className={`w-4 h-4 text-gray-500 ${className}`} />
}

const SpeakerIcon: FC<{ className?: string }> = ({ className }) => {
  return <Volume2 className={`w-4 h-4 text-gray-500 ${className}`} />
}

export const EditIconSolid: FC<{ className?: string }> = ({ className }) => {
  return <Edit className={`w-3 h-3 text-gray-500 ${className}`} fill="currentColor" />
}

const IconWrapper: FC<{ children: React.ReactNode | string }> = ({ children }) => {
  return <div className={'rounded-lg h-6 w-6 flex items-center justify-center bg-gray-100'}>
    {children}
  </div>
}

type IAnswerProps = {
  item: IChatItem & { workflowProcess?: any }
  feedbackDisabled: boolean
  onFeedback?: FeedbackFunc
  isResponding?: boolean
  allToolIcons?: Record<string, string | Emoji>
  suggestionClick?: (suggestion: string) => void
  textToSpeechEnabled?: boolean
}

// The component needs to maintain its own state to control whether to display input component
const Answer: FC<IAnswerProps> = ({
  item,
  feedbackDisabled = false,
  onFeedback,
  isResponding,
  allToolIcons,
  suggestionClick = () => { },
  textToSpeechEnabled = true,
}) => {
  const { id, content, feedback, agent_thoughts, workflowProcess, suggestedQuestions = [], citation = [], created_at } = item

  // Format the created_at timestamp for display
  const displayTime = created_at ? formatRelativeTime(created_at) : ''
  const [selectedCitation, setSelectedCitation] = useState<number | null>(null)
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null)
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null)
  const [filteredCitation, setFilteredCitation] = useState<CitationItem[]>([])
  const [displayedCitation, setDisplayedCitation] = useState<CitationItem[]>([])
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'ready' | 'playing' | 'error'>('idle')
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const isAgentMode = !!agent_thoughts && agent_thoughts.length > 0



  const { t } = useTranslation()

  // Kiểm tra quyền truy cập tài liệu và lọc citation
  useEffect(() => {
    // Tránh gọi API nếu không có citation
    if (!citation || citation.length === 0) {
      setFilteredCitation([])
      return
    }

    // Sử dụng biến để theo dõi nếu component vẫn mounted
    let isMounted = true

    const checkDocumentAccessRights = async () => {
      try {
        // Lấy danh sách document IDs từ citation
        const documentIds = citation.map(cite => cite.document_id)

        const response = await checkDocumentAccess(documentIds)

        // Kiểm tra nếu component vẫn mounted trước khi cập nhật state
        if (!isMounted) return

        if (!response) {
          console.error('Failed to check document access, showing all citations as fallback')
          setFilteredCitation(citation)
          return
        }

        const { accessResults } = response as any

        // Kiểm tra nếu component vẫn mounted trước khi cập nhật state
        if (!isMounted) return

        // Lọc citation dựa trên kết quả kiểm tra quyền truy cập
        const filtered = citation.filter(cite => {
          const accessResult = accessResults.find((result: { documentId: string; hasAccess: boolean }) =>
            result.documentId === cite.document_id
          )
          return accessResult && accessResult.hasAccess
        })

        // Nếu không có citation nào được phép truy cập, hiển thị tất cả (fallback)
        if (filtered.length === 0 && citation.length > 0) {
          setFilteredCitation(citation)
        } else {
          setFilteredCitation(filtered)
        }
      } catch (error) {
        // Kiểm tra nếu component vẫn mounted trước khi cập nhật state
        if (!isMounted) return
        console.error('Error checking document access:', error)
        // Fallback: hiển thị tất cả citations khi có lỗi
        setFilteredCitation(citation)
      }
    }

    checkDocumentAccessRights()

    // Cleanup function để đánh dấu component đã unmounted
    return () => {
      isMounted = false
    }
  }, [item.citation]) // Sử dụng item.citation thay vì citation để tránh re-render không cần thiết
  // Lọc citation để chỉ hiển thị phần tử có score cao nhất cho mỗi cặp (dataset_id, document_id)
  useEffect(() => {
    if (!filteredCitation || filteredCitation.length === 0) {
      setDisplayedCitation([])
      return
    }

    // Tạo map để lưu trữ citation có score cao nhất cho mỗi cặp (dataset_id, document_id)
    const citationMap = new Map<string, CitationItem>()

    filteredCitation.forEach((citation) => {
      const key = `${citation.dataset_id}_${citation.document_id}`
      const existingCitation = citationMap.get(key)

      if (!existingCitation || (citation.score && existingCitation.score && citation.score > existingCitation.score)) {
        citationMap.set(key, citation)
      }
    })

    // Chuyển đổi map thành array và sắp xếp theo score giảm dần
    const uniqueCitations = Array.from(citationMap.values()).sort((a, b) => {
      const scoreA = a.score || 0
      const scoreB = b.score || 0
      return scoreB - scoreA
    })

    setDisplayedCitation(uniqueCitations)
  }, [filteredCitation])
  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.src = ''
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [currentAudio, audioUrl])
  const handleCitationClick = (index: number, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    setPopupPosition({
      x: rect.right + 10,
      y: rect.top
    })
    setSelectedCitation(index)
  }

  const closePopup = () => {
    setSelectedCitation(null)
    setPopupPosition(null)
  }

  const downloadFile = async (datasetId: string, documentId: string, index: number) => {
    try {
      setDownloadingIndex(index)
      await downloadAndSaveCitation({ datasetId, documentId })
    } catch (error) {
      // You can add toast notification here
    } finally {
      setDownloadingIndex(null)
    }
  }

  const handleTextToAudio = async () => {
    if (!content || !id) return

    // Handle different audio states
    switch (audioState) {
      case 'playing':
        // Pause if currently playing
        if (currentAudio) {
          currentAudio.pause()
          setAudioState('ready')
        }
        return

      case 'ready':
        // Play if audio is ready
        if (currentAudio && audioUrl) {
          try {
            await currentAudio.play()
            setAudioState('playing')
          } catch (error: any) {
            setAudioError('Cannot play audio. Please try clicking again.')
            setAudioState('error')
          }
        }
        return

      case 'loading':
        // Already loading, do nothing
        return

      default:
        // Start converting text to audio
        break
    }

    try {
      setAudioState('loading')
      setAudioError(null)

      // Clean up previous audio
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.src = ''
        setCurrentAudio(null)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
      }

      // Use service to convert text to audio
      const response = await convertTextToAudio(id, content)

      if (!response) {
        throw new Error('No response from text-to-audio service')
      }

      let audioBlob: Blob

      // Handle different response types from service
      if (response instanceof Response) {
        // Check content type for Response objects
        const contentType = response.headers.get('Content-Type') || ''
        if (!contentType.startsWith('audio/')) {
          throw new Error(`Expected audio data but received: ${contentType}`)
        }
        audioBlob = await response.blob()
      } else if (response instanceof Blob) {
        audioBlob = response
      } else {
        throw new Error('Unexpected response format from text-to-audio service')
      }

      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('Received empty audio data')
      }

      // Create audio URL
      const newAudioUrl = URL.createObjectURL(audioBlob)
      setAudioUrl(newAudioUrl)

      // Create new audio element
      const audio = new Audio()

      // Set up event listeners
      audio.addEventListener('loadeddata', () => {
        setAudioState('ready')

        // Try to play immediately (this will work because it's still within user gesture)
        audio.play().then(() => {
          setAudioState('playing')
        }).catch((error: any) => {
          if (error.name === 'NotAllowedError') {
            setAudioError('Click the speaker button to play audio')
          } else {
            setAudioError('Error playing audio. Please try again.')
            setAudioState('error')
          }
        })
      })

      audio.addEventListener('error', (e) => {
        setAudioError('Audio format not supported by your browser')
        setAudioState('error')
        URL.revokeObjectURL(newAudioUrl)
      })

      audio.addEventListener('ended', () => {
        setAudioState('idle')
        URL.revokeObjectURL(newAudioUrl)
        setCurrentAudio(null)
        setAudioUrl(null)
      })

      audio.addEventListener('pause', () => {
        setAudioState('ready')
      })

      audio.addEventListener('play', () => {
        setAudioState('playing')
      })

      // Set source and store reference
      audio.src = newAudioUrl
      setCurrentAudio(audio)

    } catch (error: any) {
      setAudioError(error.message)
      setAudioState('error')

      // Clean up on error
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
      }
      setCurrentAudio(null)
    }
  }

  const handleCopyText = async () => {
    if (!content) return

    try {
      await navigator.clipboard.writeText(content)
      Toast.notify({
        type: 'success',
        message: 'Văn bản đã được sao chép vào clipboard',
        duration: 3000
      })
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = content
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)

      Toast.notify({
        type: 'success',
        message: 'Văn bản đã được sao chép vào clipboard',
        duration: 3000
      })
    }
  }
  /**
   * Render text-to-audio button
   * @returns comp
   */
  const renderTextToAudioButton = () => {
    return (
      <Tooltip selector={`text-to-audio-${randomString(16)}`} content={
        audioState === 'playing'
          ? "Dừng phát âm thanh"
          : audioState === 'ready'
            ? "Phát âm thanh"
            : audioState === 'loading'
              ? "Đang chuyển đổi..."
              : audioError
                ? audioError
                : "Chuyển văn bản thành âm thanh"
      }>
        {OperationBtn({
          innerContent: <IconWrapper>
            {audioState === 'playing'
              ? <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-1 h-3 bg-current mr-0.5 animate-pulse"></div>
                <div className="w-1 h-3 bg-current animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </div>
              : audioState === 'loading'
                ? <Loader className="w-4 h-4 animate-spin" />
                : <SpeakerIcon />
            }
          </IconWrapper>,
          onClick: handleTextToAudio,
          className: audioState === 'loading' ? 'opacity-50 cursor-wait' : ''
        })}
      </Tooltip>
    )
  }

  /**
   * Render copy text button
   * @returns comp
   */
  const renderCopyTextButton = () => {
    return (
      <Tooltip selector={`copy-text-${randomString(16)}`} content="Sao chép văn bản">
        {OperationBtn({
          innerContent: <IconWrapper>
            <Copy className="w-4 h-4 text-gray-500" />
          </IconWrapper>,
          onClick: handleCopyText
        })}
      </Tooltip>
    )
  }

  /**
 * Render feedback results (distinguish between users and administrators)
 * User reviews cannot be cancelled in Console
 * @param rating feedback result
 * @param isUserFeedback Whether it is user's feedback
 * @returns comp
 */
  const renderFeedbackRating = (rating: MessageRating | undefined) => {
    if (!rating)
      return null

    const isLike = rating === 'like'
    const ratingIconClassname = isLike ? 'text-primary-600 bg-primary-100 hover:bg-primary-200' : 'text-red-600 bg-red-100 hover:bg-red-200'
    // The tooltip is always displayed, but the content is different for different scenarios.
    return (
      <div className='flex gap-1'>
        <Tooltip
          selector={`user-feedback-${randomString(16)}`}
          content={isLike ? 'Hủy thích' : 'Hủy không thích'}
        >
          <div
            className={'relative box-border flex items-center justify-center h-7 w-7 p-0.5 rounded-lg bg-white cursor-pointer text-gray-500 hover:text-gray-800'}
            style={{ boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)' }}
            onClick={async () => {
              await onFeedback?.(id, { rating: null })
            }}
          >
            <div className={`${ratingIconClassname} rounded-lg h-6 w-6 flex items-center justify-center`}>
              <RatingIcon isLike={isLike} />
            </div>
          </div>
        </Tooltip>
        {textToSpeechEnabled && renderTextToAudioButton()}
        {renderCopyTextButton()}
        {displayTime && (
          <div className='flex items-center gap-1 ml-1 text-xs text-gray-400'>
            <span>{displayTime}</span>
          </div>
        )}
      </div>
    )
  }

  /**
   * Different scenarios have different operation items.
   * @returns comp
   */
  const renderItemOperation = () => {
    const userOperation = () => {
      return feedback?.rating
        ? null
        : <div className='flex items-center gap-1'>
          <Tooltip selector={`user-feedback-${randomString(16)}`} content={t('common.operation.like') as string}>
            {OperationBtn({ innerContent: <IconWrapper><RatingIcon isLike={true} /></IconWrapper>, onClick: () => onFeedback?.(id, { rating: 'like' }) })}
          </Tooltip>
          <Tooltip selector={`user-feedback-${randomString(16)}`} content={t('common.operation.dislike') as string}>
            {OperationBtn({ innerContent: <IconWrapper><RatingIcon isLike={false} /></IconWrapper>, onClick: () => onFeedback?.(id, { rating: 'dislike' }) })}
          </Tooltip>
          {textToSpeechEnabled && renderTextToAudioButton()}
          {renderCopyTextButton()}
          {displayTime && (
            <div className='flex items-center gap-1 ml-1 text-xs text-gray-400'>
              <span>{displayTime}</span>
            </div>
          )}
        </div>
    }

    return (
      <div className={`${s.itemOperation} flex gap-2`}>
        {userOperation()}
      </div>
    )
  }

  const getImgs = (list?: VisionFile[]) => {
    if (!list)
      return []
    return list.filter(file => file.type === 'image' && file.belongs_to === 'assistant')
  }

  const agentModeAnswer = (
    <div>
      {agent_thoughts?.map((item, index) => (
        <div key={index}>
          {item.thought && (
            <Markdown content={item.thought} />
          )}
          {/* {item.tool} */}
          {/* perhaps not use tool */}
          {!!item.tool && (
            <Thought
              thought={item}
              allToolIcons={allToolIcons || {}}
              isFinished={!!item.observation || !isResponding}
            />
          )}

          {getImgs(item.message_files).length > 0 && (
            <ImageGallery srcs={getImgs(item.message_files).map(item => item.url)} />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div key={id} className='mb-6'>
      <div className='flex items-start gap-3'>
        <div className='w-8 h-8 shrink-0 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium'>
          AI
        </div>
        <div className='flex-1 max-w-[85%]'>
          <div className='relative text-sm text-gray-900'>
            <div className='py-3 px-4 bg-gray-50 rounded-lg'>
              {workflowProcess && (
                <WorkflowProcess data={workflowProcess} hideInfo />
              )}
              {(isResponding && (isAgentMode ? (!content && (agent_thoughts || []).filter(item => !!item.thought || !!item.tool).length === 0) : !content))
                ? (
                  <div className='flex items-center justify-center w-6 h-5'>
                    <LoadingAnim type='text' />
                  </div>
                )
                : (isAgentMode
                  ? agentModeAnswer
                  : (
                    <div>
                      {/* Text streaming content - always visible */}
                      <Markdown content={content} />
                      {displayedCitation && displayedCitation.length > 0 && (
                        <div className='mt-4'>
                          <div className='text-xs font-semibold mb-3 flex items-center text-gray-800 uppercase tracking-wide'>
                            <span>Tham khảo</span>
                            <div className="ml-3 h-[1px] flex-grow bg-gradient-to-r from-gray-300 to-transparent"></div>
                          </div>
                          {/* Horizontal scrollable citation list */}
                          <div className='overflow-x-auto overflow-y-hidden w-full scrollbar-hide' style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <div className='flex gap-3 pb-2'>
                              {displayedCitation.map((citationItem: CitationItem, index: number) => (
                                <div
                                  key={index}
                                  className='flex-shrink-0 bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group'
                                  onClick={(e) => handleCitationClick(index, e)}
                                >
                                  <div className='flex items-center gap-3 p-2 min-w-[200px]'>
                                    <FileText className='w-5 h-5 text-blue-700' />
                                    <div className='flex-1 min-w-0'>
                                      <div className='text-sm font-medium text-gray-900 truncate group-hover:text-blue-900 transition-colors'>
                                        {citationItem.document_name}
                                      </div>
                                      <div className='text-xs text-gray-500 mt-0.5 truncate'>
                                        {citationItem.dataset_name}
                                      </div>
                                    </div>
                                    <div className='relative group'>
                                      <div className='px-1 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full group-hover:bg-blue-100 transition-colors cursor-pointer'
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          downloadFile(citationItem.dataset_id, citationItem.document_id, index)
                                        }}
                                      >
                                        <div className='flex items-center justify-center w-5 h-5'>
                                          {downloadingIndex === index ? (
                                            <Loader className='w-3 h-3 animate-spin' />
                                          ) : (
                                            <span className='group-hover:hidden'>#{index + 1}</span>
                                          )}
                                          <ArrowDownToLine className='w-4 h-4 hidden group-hover:block' />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Citation popup */}
                          {selectedCitation !== null && popupPosition && displayedCitation.length > 0 && (
                            <>
                              {/* Backdrop */}
                              <div
                                className='fixed inset-0 z-40'
                                onClick={closePopup}
                              />

                              {/* Popup */}
                              <div
                                className='fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl max-w-lg min-w-96'
                                style={{
                                  left: `${popupPosition.x}px`,
                                  top: `${popupPosition.y}px`,
                                  transform: 'translateY(-50%)'
                                }}
                              >
                                <div className='p-4'>
                                  {/* Header */}
                                  <div className='flex items-start justify-between mb-3'>
                                    <div className='flex items-center gap-3'>
                                      <div className='flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center'>
                                        <File className='w-5 h-5 text-blue-600' />
                                      </div>
                                      <div className='flex-1 min-w-0'>
                                        <h4 className='text-sm font-semibold text-gray-900 mb-1'>
                                          {displayedCitation[selectedCitation].document_name}
                                        </h4>
                                        <div className='text-xs text-gray-600 flex items-center gap-1'>
                                          <div className='w-3 h-3'>▪</div>
                                          <span>Nguồn: <span className='font-medium text-gray-700'>{displayedCitation[selectedCitation].dataset_name}</span></span>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={closePopup}
                                      className='text-gray-400 hover:text-gray-600 transition-colors'
                                    >
                                      <X className='w-4 h-4' />
                                    </button>
                                  </div>

                                  {/* Content */}
                                  <div className='text-sm text-gray-700 leading-relaxed mb-4 bg-gray-50 p-3 rounded-lg max-h-68 overflow-y-auto'>
                                    "{displayedCitation[selectedCitation].content}"
                                  </div>

                                  {/* Metadata */}
                                  <div className='flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100'>
                                    <div className='flex items-center gap-1'>
                                      <Zap className='w-3 h-3' />
                                      <span>Điểm: {displayedCitation[selectedCitation].score?.toFixed(2) || 'N/A'}</span>
                                    </div>
                                    <div className='flex items-center gap-1'>
                                      <RotateCcw className='w-3 h-3' />
                                      <span>{displayedCitation[selectedCitation].word_count || 0} từ</span>
                                    </div>
                                    {displayedCitation[selectedCitation].hit_count > 0 && (
                                      <div className='flex items-center gap-1'>
                                        <Eye className='w-3 h-3' />
                                        <span>{displayedCitation[selectedCitation].hit_count} lần xem</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
            </div>
            <div className='flex flex-row justify-start gap-1 mt-2'>
              {!feedbackDisabled && !item.feedbackDisabled && !isResponding && renderItemOperation()}
              {/* Phản hồi của người dùng phải được hiển thị*/}
              {!feedbackDisabled && !isResponding && renderFeedbackRating(feedback?.rating)}
            </div>
            {suggestedQuestions.length > 0 && (
              <div className='flex flex-col items-start justify-center mt-4'>
                <div className="text-xs font-semibold uppercase text-gray-400 shrink-0 mb-2">Thử hỏi</div>
                <div className='flex gap-2 flex-wrap'>
                  {suggestedQuestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      className='text-sm !px-3 !py-1.5 border border-gray-200 rounded-full hover:bg-gray-50'
                      type='link'
                      onClick={() => suggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default React.memo(Answer)
