import React, { useState } from 'react'
import { useStore } from '@renderer/store'
import { HelpCircle, Send } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Card } from '@renderer/components/ui/card'

/**
 * Inline question card shown while the agent waits for an answer to an
 * ask_user tool call. Renders nothing when there is no pending question.
 */
export const AskUserPrompt: React.FC = () => {
  const pendingQuestion = useStore((state) => state.pendingQuestion)
  const answerQuestion = useStore((state) => state.answerQuestion)
  const [customAnswer, setCustomAnswer] = useState('')

  if (!pendingQuestion) return null

  const handleCustomSubmit = (): void => {
    const answer = customAnswer.trim()
    if (!answer) return
    answerQuestion(answer)
    setCustomAnswer('')
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCustomSubmit()
    }
  }

  return (
    <Card className="border-primary/30 bg-primary-container/10 p-3 space-y-3">
      <div className="flex items-start gap-2">
        <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-on-surface whitespace-pre-wrap">{pendingQuestion.question}</p>
      </div>

      {pendingQuestion.options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pendingQuestion.options.map((option) => (
            <Button
              key={option}
              size="sm"
              variant="outline"
              className="border-primary/30 hover:bg-primary-container/30"
              onClick={() => answerQuestion(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={customAnswer}
          onChange={(e) => setCustomAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            pendingQuestion.options.length > 0 ? 'Or type your own answer...' : 'Type your answer...'
          }
          className="flex-1 h-8 text-sm"
        />
        <Button
          size="icon"
          className="h-8 w-8"
          disabled={!customAnswer.trim()}
          onClick={handleCustomSubmit}
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  )
}
