'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function TTSDemo() {
  const [text, setText] = useState("Welcome to our text-to-speech demo powered by ElevenLabs. Type any text and click the button to hear it spoken.");
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // ElevenLabs API key
  const apiKey = 'sk_03c3ff9bfed302c29b664036f7e929404cf7e820b795c7c5';
  
  const handleGenerateSpeech = async () => {
    if (!text.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Make a direct fetch request to the ElevenLabs API
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      // Get the audio data as arrayBuffer
      const audioData = await response.arrayBuffer();
      
      // Create a blob and URL
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      // Update the state with the new audio URL
      setAudioUrl(url);
    } catch (err) {
      console.error('Error generating speech:', err);
      setError('Failed to generate speech. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>ElevenLabs Text-to-Speech Demo</CardTitle>
          <CardDescription>
            Convert your text to lifelike speech using the ElevenLabs API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="text-input" className="text-sm font-medium">
              Text to Convert
            </label>
            <Textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to convert to speech..."
              className="min-h-32"
            />
          </div>
          
          {audioUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Generated Audio</label>
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerateSpeech}
            disabled={isLoading || !text.trim()}
            className="w-full"
          >
            {isLoading ? 'Generating...' : 'Generate Speech'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 