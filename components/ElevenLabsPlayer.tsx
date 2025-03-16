'use client';

import { useState, useRef, useEffect } from 'react';
import { ElevenLabsClient } from 'elevenlabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Voice {
  voice_id: string;
  name: string;
}

interface ElevenLabsPlayerProps {
  text: string;
  voiceId?: string;
}

export function ElevenLabsPlayer({ 
  text,
  voiceId = "21m00Tcm4TlvDq8ikWAM" // Default voice ID (Rachel)
}: ElevenLabsPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState(voiceId);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // This should be in an environment variable
  const apiKey = 'sk_03c3ff9bfed302c29b664036f7e929404cf7e820b795c7c5';
  
  // Fetch available voices on component mount
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setLoadingVoices(true);
        
        // Using fetch for direct API access instead of the client
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: {
            'xi-api-key': apiKey
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch voices: ${response.status}`);
        }
        
        const data = await response.json();
        setVoices(data.voices || []);
      } catch (err) {
        console.error('Error fetching voices:', err);
        setError('Failed to load available voices.');
      } finally {
        setLoadingVoices(false);
      }
    };
    
    fetchVoices();
  }, [apiKey]);
  
  const handleTextToSpeech = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize the ElevenLabs client
      const client = new ElevenLabsClient({
        apiKey: apiKey,
      });
      
      // Convert text to speech
      const audio = await client.textToSpeech.convert(
        selectedVoiceId,
        {
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        }
      );
      
      // The returned audio is a Readable stream, we need to convert it to a buffer
      const chunks = [];
      for await (const chunk of audio) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      
      // Create a blob URL from the audio data
      const blob = new Blob([buffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      // Set the audio source and play
      if (audioRef.current) {
        audioRef.current.src = url;
        
        // Safely play audio with proper error handling
        try {
          const playPromise = audioRef.current.play();
          
          // Proper error handling for browsers that return a promise from play()
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              if (error.name === 'NotAllowedError') {
                console.log('Autoplay prevented - user needs to interact with the page first');
                setError('Click the Play button on the audio player to listen');
              } else {
                console.error('Error playing audio:', error);
                setError('Unable to play audio: ' + error.message);
              }
            });
          }
        } catch (playError) {
          console.error('Error setting up audio playback:', playError);
          setError('Error playing audio. Try clicking play manually.');
        }
      }
    } catch (err) {
      console.error('Error generating speech:', err);
      setError('Failed to generate speech. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {voices.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Voice</label>
          <Select
            value={selectedVoiceId}
            onValueChange={setSelectedVoiceId}
            disabled={loadingVoices}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.voice_id} value={voice.voice_id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <audio ref={audioRef} controls className="w-full" />
      <Button 
        onClick={handleTextToSpeech} 
        disabled={isLoading || text.trim().length === 0}
      >
        {isLoading ? 'Generating...' : 'Generate Speech'}
      </Button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
} 