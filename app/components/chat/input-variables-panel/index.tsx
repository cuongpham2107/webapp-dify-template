'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import { Settings2, Check } from 'lucide-react'
import type { PromptVariable } from '@/types/app'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Tooltip from '@/app/components/base/tooltip'

export type InputVariablesPanelProps = {
    variables: PromptVariable[]
    values: Record<string, any>
    onChange: (values: Record<string, any>) => void
    className?: string
}

const InputVariablesPanel: FC<InputVariablesPanelProps> = ({
    variables,
    values,
    onChange,
    className = '',
}) => {
    const [open, setOpen] = useState(false)
    const [tempValues, setTempValues] = useState<Record<string, any>>(values)

    // Only render select type variables
    const selectVariables = variables.filter(v => v.type === 'select')

    if (selectVariables.length === 0) {
        return null
    }

    // Sync tempValues when dialog opens
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setTempValues(values)
        }
        setOpen(isOpen)
    }

    const handleValueChange = (key: string, value: string) => {
        setTempValues({
            ...tempValues,
            [key]: value,
        })
    }

    const handleConfirm = () => {
        onChange(tempValues)
        setOpen(false)
    }

    const handleCancel = () => {
        setTempValues(values)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Tooltip
                selector='variables-tip'
                content='Chọn chủ đề cho cuộc trò chuyện'
            >
                <DialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`w-8 h-8 mr-2 hover:bg-gray-100 text-gray-600 ${className}`}
                        type="button"
                    >
                        <Settings2 className="w-4 h-4" />
                    </Button>
                </DialogTrigger>
            </Tooltip>
            <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cấu hình tham số</DialogTitle>
                    <DialogDescription>
                        Chọn các tham số cho cuộc trò chuyện của bạn
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {selectVariables.map((variable) => (
                        <div key={variable.key} className="space-y-3">
                            <Label className="text-sm font-semibold text-gray-900">
                                {variable.name}
                                {variable.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            <RadioGroup
                                value={tempValues[variable.key] || variable.default || ''}
                                onValueChange={(value) => handleValueChange(variable.key, value)}
                                className="grid grid-cols-3 gap-3"
                            >
                                {(variable.options || []).map((option) => (
                                    <Card
                                        key={option}
                                        className={cn(
                                            'relative flex items-center space-x-3 p-4 cursor-pointer transition-all hover:border-primary hover:shadow-sm',
                                            tempValues[variable.key] === option && 'border-primary bg-primary/5 shadow-sm'
                                        )}
                                        onClick={() => handleValueChange(variable.key, option)}
                                    >
                                        <RadioGroupItem value={option} id={`${variable.key}-${option}`} />
                                        <Label
                                            htmlFor={`${variable.key}-${option}`}
                                            className="flex-1 cursor-pointer text-sm font-medium leading-relaxed"
                                        >
                                            {option}
                                        </Label>
                                        {tempValues[variable.key] === option && (
                                            <Check className="w-4 h-4 text-primary" />
                                        )}
                                    </Card>
                                ))}
                            </RadioGroup>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            type="button"
                        >
                            Hủy
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleConfirm}
                        type="button"
                    >
                        Xác nhận
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default InputVariablesPanel
