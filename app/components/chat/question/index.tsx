'use client'
import type { FC } from 'react'
import React from 'react'
import type { IChatItem } from '../type'
import s from '../style.module.css'

import { Markdown } from '@/app/components/base/markdown'
import ImageGallery from '@/app/components/base/image-gallery'

type IQuestionProps = Pick<IChatItem, 'id' | 'content' | 'useCurrentUserAvatar'> & {
  imgSrcs?: string[]
}

const Question: FC<IQuestionProps> = ({ id, content, useCurrentUserAvatar, imgSrcs }) => {
  const userName = ''
  return (
    <div className='flex items-start justify-end gap-3 mb-6' key={id}>
      <div className='max-w-[70%]'>
        <div className={`${s.question} relative text-sm text-gray-900`}>
          <div className='py-3 px-4 bg-gray-100 rounded-2xl border border-gray-200'>
            {imgSrcs && imgSrcs.length > 0 && (
              <ImageGallery srcs={imgSrcs} />
            )}
            <Markdown content={content} />
          </div>
        </div>
      </div>
      {useCurrentUserAvatar
        ? (
          <div className='w-8 h-8 shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium'>
            {userName?.[0]?.toLocaleUpperCase() || 'U'}
          </div>
        )
        : (
          <div className='w-8 h-8 shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium'>
            U
          </div>
        )}
    </div>
  )
}

export default React.memo(Question)
