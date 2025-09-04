'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import { downloadAndSaveCitation } from '@/lib/api/citations'
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/24/outline'
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
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M6.25002 1C3.62667 1 1.50002 3.12665 1.50002 5.75C1.50002 6.28 1.58702 6.79071 1.7479 7.26801C1.7762 7.35196 1.79285 7.40164 1.80368 7.43828L1.80722 7.45061L1.80535 7.45452C1.79249 7.48102 1.77339 7.51661 1.73766 7.58274L0.911727 9.11152C0.860537 9.20622 0.807123 9.30503 0.770392 9.39095C0.733879 9.47635 0.674738 9.63304 0.703838 9.81878C0.737949 10.0365 0.866092 10.2282 1.05423 10.343C1.21474 10.4409 1.38213 10.4461 1.475 10.4451C1.56844 10.444 1.68015 10.4324 1.78723 10.4213L4.36472 10.1549C4.406 10.1506 4.42758 10.1484 4.44339 10.1472L4.44542 10.147L4.45161 10.1492C4.47103 10.1562 4.49738 10.1663 4.54285 10.1838C5.07332 10.3882 5.64921 10.5 6.25002 10.5C8.87338 10.5 11 8.37335 11 5.75C11 3.12665 8.87338 1 6.25002 1ZM4.48481 4.29111C5.04844 3.81548 5.7986 3.9552 6.24846 4.47463C6.69831 3.9552 7.43879 3.82048 8.01211 4.29111C8.58544 4.76175 8.6551 5.562 8.21247 6.12453C7.93825 6.47305 7.24997 7.10957 6.76594 7.54348C6.58814 7.70286 6.49924 7.78255 6.39255 7.81466C6.30103 7.84221 6.19589 7.84221 6.10436 7.81466C5.99767 7.78255 5.90878 7.70286 5.73098 7.54348C5.24694 7.10957 4.55867 6.47305 4.28444 6.12453C3.84182 5.562 3.92117 4.76675 4.48481 4.29111Z" fill="#667085" />
  </svg>
)

const RatingIcon: FC<{ isLike: boolean }> = ({ isLike }) => {
  return isLike ? <HandThumbUpIcon className='w-4 h-4' /> : <HandThumbDownIcon className='w-4 h-4' />
}

const EditIcon: FC<{ className?: string }> = ({ className }) => {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M14 11.9998L13.3332 12.7292C12.9796 13.1159 12.5001 13.3332 12.0001 13.3332C11.5001 13.3332 11.0205 13.1159 10.6669 12.7292C10.3128 12.3432 9.83332 12.1265 9.33345 12.1265C8.83359 12.1265 8.35409 12.3432 7.99998 12.7292M2 13.3332H3.11636C3.44248 13.3332 3.60554 13.3332 3.75899 13.2963C3.89504 13.2637 4.0251 13.2098 4.1444 13.1367C4.27895 13.0542 4.39425 12.9389 4.62486 12.7083L13 4.33316C13.5523 3.78087 13.5523 2.88544 13 2.33316C12.4477 1.78087 11.5523 1.78087 11 2.33316L2.62484 10.7083C2.39424 10.9389 2.27894 11.0542 2.19648 11.1888C2.12338 11.3081 2.0695 11.4381 2.03684 11.5742C2 11.7276 2 11.8907 2 12.2168V13.3332Z" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}

export const EditIconSolid: FC<{ className?: string }> = ({ className }) => {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path fillRule="evenodd" clip-rule="evenodd" d="M10.8374 8.63108C11.0412 8.81739 11.0554 9.13366 10.8691 9.33747L10.369 9.88449C10.0142 10.2725 9.52293 10.5001 9.00011 10.5001C8.47746 10.5001 7.98634 10.2727 7.63157 9.8849C7.45561 9.69325 7.22747 9.59515 7.00014 9.59515C6.77271 9.59515 6.54446 9.69335 6.36846 9.88517C6.18177 10.0886 5.86548 10.1023 5.66201 9.91556C5.45853 9.72888 5.44493 9.41259 5.63161 9.20911C5.98678 8.82201 6.47777 8.59515 7.00014 8.59515C7.52251 8.59515 8.0135 8.82201 8.36867 9.20911L8.36924 9.20974C8.54486 9.4018 8.77291 9.50012 9.00011 9.50012C9.2273 9.50012 9.45533 9.40182 9.63095 9.20979L10.131 8.66276C10.3173 8.45895 10.6336 8.44476 10.8374 8.63108Z" fill="#6B7280" />
    <path fillRule="evenodd" clip-rule="evenodd" d="M7.89651 1.39656C8.50599 0.787085 9.49414 0.787084 10.1036 1.39656C10.7131 2.00604 10.7131 2.99419 10.1036 3.60367L3.82225 9.88504C3.81235 9.89494 3.80254 9.90476 3.79281 9.91451C3.64909 10.0585 3.52237 10.1855 3.3696 10.2791C3.23539 10.3613 3.08907 10.4219 2.93602 10.4587C2.7618 10.5005 2.58242 10.5003 2.37897 10.5001C2.3652 10.5001 2.35132 10.5001 2.33732 10.5001H1.50005C1.22391 10.5001 1.00005 10.2763 1.00005 10.0001V9.16286C1.00005 9.14886 1.00004 9.13497 1.00003 9.1212C0.999836 8.91776 0.999669 8.73838 1.0415 8.56416C1.07824 8.4111 1.13885 8.26479 1.22109 8.13058C1.31471 7.97781 1.44166 7.85109 1.58566 7.70736C1.5954 7.69764 1.60523 7.68783 1.61513 7.67793L7.89651 1.39656Z" fill="#6B7280" />
  </svg>
}

const IconWrapper: FC<{ children: React.ReactNode | string }> = ({ children }) => {
  return <div className={'rounded-lg h-6 w-6 flex items-center justify-center hover:bg-gray-100'}>
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
}

// The component needs to maintain its own state to control whether to display input component
const Answer: FC<IAnswerProps> = ({
  item,
  feedbackDisabled = false,
  onFeedback,
  isResponding,
  allToolIcons,
  suggestionClick = () => { },
}) => {
  const { id, content, feedback, agent_thoughts, workflowProcess, suggestedQuestions = [], citation = [] } = item
  const [selectedCitation, setSelectedCitation] = useState<number | null>(null)
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null)
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null)
  const isAgentMode = !!agent_thoughts && agent_thoughts.length > 0
  const { t } = useTranslation()

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
      console.error('Error downloading file:', error)
      // You can add toast notification here
    } finally {
      setDownloadingIndex(null)
    }
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
        : <div className='flex gap-1'>
          <Tooltip selector={`user-feedback-${randomString(16)}`} content={t('common.operation.like') as string}>
            {OperationBtn({ innerContent: <IconWrapper><RatingIcon isLike={true} /></IconWrapper>, onClick: () => onFeedback?.(id, { rating: 'like' }) })}
          </Tooltip>
          <Tooltip selector={`user-feedback-${randomString(16)}`} content={t('common.operation.dislike') as string}>
            {OperationBtn({ innerContent: <IconWrapper><RatingIcon isLike={false} /></IconWrapper>, onClick: () => onFeedback?.(id, { rating: 'dislike' }) })}
          </Tooltip>
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
    <div key={id}>
      <div className='flex items-start'>
        <div className={`${s.answerIcon} w-10 h-10 shrink-0`}>
          {isResponding
            && <div className={s.typeingIcon}>
              <LoadingAnim type='avatar' />
            </div>
          }
        </div>
        <div className={`${s.answerWrap} max-w-full overflow-hidden`}>
          <div className={`${s.answer} relative text-sm text-gray-900 max-w-full overflow-hidden`}>
            <div className={`ml-2 py-3 px-4 bg-gray-100 rounded-tr-2xl rounded-b-2xl max-w-full overflow-hidden ${workflowProcess && 'min-w-[480px]'}`}>
              {/* {workflowProcess && (
                <WorkflowProcess data={workflowProcess} hideInfo />
              )} */}
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
                      <Markdown content={content} />
                      {citation && citation.length > 0 && (
                        <div className='mt-4'>
                          <div className='text-xs font-semibold mb-3 flex items-center text-gray-800 uppercase tracking-wide'>
                            <span>Tham khảo</span>
                            <div className="ml-3 h-[1px] flex-grow bg-gradient-to-r from-gray-300 to-transparent"></div>
                          </div>
                          {/* Horizontal scrollable citation list */}
                          <div className='overflow-x-auto overflow-y-hidden w-full scrollbar-hide' style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <div className='flex gap-3 pb-2'>
                              {citation.map((citationItem: CitationItem, index: number) => (
                                <div
                                  key={index}
                                  className='flex-shrink-0 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group'
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
                                            <svg className='w-3 h-3 animate-spin' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
                                            </svg>
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
                          {selectedCitation !== null && popupPosition && (
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
                                        <svg className='w-5 h-5 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
                                          <path fillRule='evenodd' d='M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z' clipRule='evenodd' />
                                        </svg>
                                      </div>
                                      <div className='flex-1 min-w-0'>
                                        <h4 className='text-sm font-semibold text-gray-900 mb-1'>
                                          {citation[selectedCitation].document_name}
                                        </h4>
                                        <div className='text-xs text-gray-600 flex items-center gap-1'>
                                          <svg className='w-3 h-3 text-gray-400' fill='currentColor' viewBox='0 0 20 20'>
                                            <path fillRule='evenodd' d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' clipRule='evenodd' />
                                          </svg>
                                          <span>Nguồn: <span className='font-medium text-gray-700'>{citation[selectedCitation].dataset_name}</span></span>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={closePopup}
                                      className='text-gray-400 hover:text-gray-600 transition-colors'
                                    >
                                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                                      </svg>
                                    </button>
                                  </div>

                                  {/* Content */}
                                  <div className='text-sm text-gray-700 leading-relaxed mb-4 bg-gray-50 p-3 rounded-lg max-h-68 overflow-y-auto'>
                                    "{citation[selectedCitation].content}"
                                  </div>

                                  {/* Metadata */}
                                  <div className='flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100'>
                                    <div className='flex items-center gap-1'>
                                      <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                        <path fillRule='evenodd' d='M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z' clipRule='evenodd' />
                                      </svg>
                                      <span>Điểm: {citation[selectedCitation].score?.toFixed(2) || 'N/A'}</span>
                                    </div>
                                    <div className='flex items-center gap-1'>
                                      <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                        <path fillRule='evenodd' d='M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z' clipRule='evenodd' />
                                      </svg>
                                      <span>{citation[selectedCitation].word_count || 0} từ</span>
                                    </div>
                                    {citation[selectedCitation].hit_count > 0 && (
                                      <div className='flex items-center gap-1'>
                                        <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                          <path d='M10 12a2 2 0 100-4 2 2 0 000 4z' />
                                          <path fillRule='evenodd' d='M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z' clipRule='evenodd' />
                                        </svg>
                                        <span>{citation[selectedCitation].hit_count} lần xem</span>
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
            <div className='flex flex-row justify-start gap-1 mt-1 ml-2'>
              {!feedbackDisabled && !item.feedbackDisabled && renderItemOperation()}
              {/* User feedback must be displayed */}
              {!feedbackDisabled && renderFeedbackRating(feedback?.rating)}
            </div>
            {suggestedQuestions.length > 0 && (
              <div className='flex flex-col items-center justify-center mt-3'>
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <div className="flex-grow my-2 h-px bg-gradient-to-r from-gray-200 to-transparent rotate-180"></div>
                  <div className="text-xs font-semibold uppercase text-gray-400 shrink-0">Thử hỏi</div>
                  <div className="flex-grow my-2 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
                </div>
                <div className='flex gap-1 mt-1 flex-wrap'>
                  {suggestedQuestions.map((suggestion, index) => (
                    <div key={index} className='flex items-center gap-1'>
                      <Button className='text-sm !px-1.5 !py-0.5 h-3' type='link' onClick={() => suggestionClick(suggestion)}>{suggestion}</Button>
                    </div>
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
