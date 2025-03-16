"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { translateTerm } from "@/app/actions"

interface TermTranslatorProps {
  term: string
  onTranslate: (translation: string) => void
}

export default function TermTranslator({ term, onTranslate }: TermTranslatorProps) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [translationResult, setTranslationResult] = useState<string | null>(null)

  const handleTranslate = async () => {
    setIsTranslating(true)
    setError(null)
    setTranslationResult(null)

    try {
      const result = await translateTerm(term)

      if (result.success && result.translation) {
        setTranslationResult(result.translation)
        onTranslate(result.translation)
      } else {
        setError("Failed to translate term. Please try again.")
      }
    } catch (err) {
      setError("An error occurred during translation.")
      console.error(err)
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <div className="bg-muted/60 p-3 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Translate to Jamaican Creole</span>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleTranslate}
          disabled={isTranslating}
        >
          {isTranslating ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Translating...
            </>
          ) : (
            "Translate"
          )}
        </Button>
      </div>

      {translationResult && (
        <div className="mt-2 text-sm">
          <p className="whitespace-pre-wrap">{translationResult}</p>
        </div>
      )}

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  )
}

