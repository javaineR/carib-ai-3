'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ElevenLabsPlayer } from '@/components/ElevenLabsPlayer';

export default function VoiceSelectionDemo() {
  const [text, setText] = useState("Welcome to our learning module. This text will be read using the selected voice from ElevenLabs.");

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Voice Selection for Learning Modules</CardTitle>
          <CardDescription>
            Choose from different voices for your learning module narration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="text-input" className="text-sm font-medium">
              Learning Module Text
            </label>
            <Textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text for the learning module..."
              className="min-h-32"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Voice Selection</h3>
            <p className="text-sm text-muted-foreground">
              Select a voice from the options below and generate speech to hear how it sounds.
            </p>
            <ElevenLabsPlayer text={text} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 