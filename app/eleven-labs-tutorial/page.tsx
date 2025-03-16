'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DialogueEntry {
  student: string;
  teacher: string;
  audioStatus?: 'idle' | 'loading' | 'error' | 'success';
  audioData?: string;
  studentAudioStatus?: 'idle' | 'loading' | 'error' | 'success';
  studentAudioData?: string;
}

export default function ElevenLabsTutorial() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTeacherResponse, setShowTeacherResponse] = useState(false);
  const [isChunkProcessing, setIsChunkProcessing] = useState(false);
  const [audioProcessingError, setAudioProcessingError] = useState<string | null>(null);
  
  // Audio chunking to fix the audio playback issues
  const chunkText = (text: string, maxLength = 200): string[] => {
    // If text is short enough, return it as is
    if (text.length <= maxLength) return [text];
    
    // Find a good breaking point
    let breakPoint = maxLength;
    while (breakPoint > 0 && !['.', '!', '?', '\n'].includes(text[breakPoint])) {
      breakPoint--;
    }
    
    // If no good breaking point found, use maxLength
    if (breakPoint === 0) breakPoint = maxLength;
    
    // Get first chunk and recursively process the rest
    const firstChunk = text.substring(0, breakPoint + 1).trim();
    const remainingText = text.substring(breakPoint + 1);
    
    return [firstChunk, ...chunkText(remainingText, maxLength)];
  };

  // The dialogue between student and teacher about Eleven Labs API
  const [dialogue, setDialogue] = useState<DialogueEntry[]>([
    {
      student: "What is the Eleven Labs voice API and how does it work in our application?",
      teacher: "Yow mi bredren! Di Eleven Labs voice API a one powerful technology weh wi use fi turn text into speech weh sound like real people. In we application, wi use it fi create voice dat have a real Caribbean vibe to it. Wi mek HTTP requests to di Eleven Labs server wit di text wi want fi read out, plus some special settings, and di server sen back audio data weh wi can play fi di user dem. It mek di learning experience more engaging cause instead a just reading, people can hear di information in a voice dat connect wit dem."
    },
    {
      student: "I see there's something called a \"voiceId\" in the code. What is that and why are different values being used?",
      teacher: "Yes mi yout! Di \"voiceId\" a di unique identifier fi each voice in di Eleven Labs library. Every voice have im own special ID number, like a passport number fi di voice. In we code, mi notice we use different ones:\n\nIn di `generateJamaicanVoice` function, wi use \"EXAVITQu4vr4xnSDxMaL\" which a fi di \"Oliva\" voice - dat a one Caribbean voice weh sound more like we Jamaican accent.\n\nIn di ElevenLabsPlayer component, dem use \"21m00Tcm4TlvDq8ikWAM\" as di default, which dem call \"Rachel\" - dat a more neutral voice.\n\nIn di TTS demo, dem use di same Rachel voice.\n\nWi use different voices because different situations need different styles. When wi want di authentic Jamaican experience, wi use di Caribbean voice, but sometimes wi might want a more neutral tone fi certain content. Di beauty of di system a dat wi can choose di voice weh best match di character of di content wi a deliver."
    },
    {
      student: "What is \"xi-api-key\" and why is it important for the API requests?",
      teacher: "Yuh see di \"xi-api-key\" ting deh? Dat a yuh ticket fi enter di Eleven Labs party, star! Every time wi mek a request to di Eleven Labs API, wi have fi include dis special key in di headers of di request. It's like di VIP pass weh show seh wi have permission fi use di service.\n\nWithout dis key, di request gwine fail and yuh get error. Di key identify who a mek di request so Eleven Labs can track usage, provide di right level of service, and charge di right account. Dem store it inna environment variable fi security reasons - yuh neva want mek yuh API key visible inna public code, cause anybody could use it and run up yuh bill!\n\nInna some places like di ElevenLabsPlayer, mi see dem hardcode di key (which no good fi production), but inna di `generateJamaicanVoice` function, dem proper pull it from environment variables with `process.env.ELEVEN_LABS_API_KEY`. Dat a di right way fi do it!"
    },
    {
      student: "I noticed some parameters like \"stability\" and \"similarity_boost\" in the voice settings. What do these control?",
      teacher: "Yes yes, dem parameters deh crucial fi fine-tune how di voice sound! Lemme break it down:\n\n\"stability\" control how consistent di voice stay during di speech. If yuh set it low, di voice might have more variation and sound more expressive but sometimes less predictable. If yuh set it high, di voice sound more steady and predictable. Inna we code, wi set it to 0.5 which a middle ground - not too wild, not too flat.\n\n\"similarity_boost\" determine how close di generated voice match di original voice sample. Higher values mek it stick closer to di original voice characteristics. Wi set fi wi value to 0.75 which mean wi want it sound pretty close to di original voice but still have some flexibility.\n\nSome settings have \"style\" parameter too (like inna di Jamaican voice function), which control how much stylistic elements fi include - like di emotional range and character. Wi set dat to 0.25 which mean just a touch of style.\n\nAnd \"use_speaker_boost\" weh wi turn on fi di Jamaican voice - dat enhance di clarity and quality fi mek sure people can understand even with di accent.\n\nAll a dem settings work together fi create di perfect balance between natural sound and good quality."
    },
    {
      student: "What does the \"model_id\" parameter do and why is \"eleven_multilingual_v2\" being used?",
      teacher: "Di \"model_id\" parameter a specify which AI model Eleven Labs should use fi generate di speech. It's like choosing which engine fi put inna yuh car.\n\n\"eleven_multilingual_v2\" is di model wi use throughout di code, and it's a special one. As di name suggest, dis model can handle multiple languages - not just English. Dat important fi we because Jamaican Creole mix English wit African language structures and some unique words.\n\nDi multilingual model better understand and pronounce words from different language backgrounds, so it handle di nuances of Caribbean speech patterns better. It also good fi educational content where sometimes wi might mix in words from different languages.\n\nEleven Labs have different models - some weh optimize fi speed, some fi quality, some fi specific languages - but di multilingual v2 give wi di flexibility wi need fi diverse speech patterns while still maintaining good quality. Dat a why wi stick wit it across all parts of di application."
    },
    {
      student: "Can you explain the process of handling the audio data returned from the API?",
      teacher: "Alright, check dis ya process: When di Eleven Labs API respond to we request, it nuh just send back regular text data - it send back raw audio data inna binary format. Wi have fi handle dat special way.\n\nFirst ting, wi receive di data as an ArrayBuffer - dat a like one container fi raw binary data. Yuh can see dis inna di `generateJamaicanVoice` function and di TTS demo page.\n\nAfter dat, wi have two different approaches depending on di context:\n\nInna di `generateJamaicanVoice` function, wi take di ArrayBuffer and convert it to base64 string using `Buffer.from(audioData).toString('base64')`. Den wi return it as a data URL with di format `data:audio/mpeg;base64,${base64Audio}` so it can be easily used as source fi audio element inna HTML.\n\nInna di TTS demo and ElevenLabsPlayer, dem take a different approach. Dem convert di ArrayBuffer to a Blob object wit di correct MIME type ('audio/mpeg'), den use URL.createObjectURL to create a temporary URL pointing to dat blob. Dis URL den get set as di source fi an audio element.\n\nWid di ElevenLabsPlayer, dem even have extra step because dem use di client library which return a Readable stream, so dem have fi collect all di chunks from di stream before dem can process di data.\n\nAll a dese approaches give di same result - audio weh di user can play - but dem handle di data slightly different depending on where and how di audio need fi be used."
    },
    {
      student: "What error handling strategies are implemented when using the Eleven Labs API?",
      teacher: "Bwoy, error handling crucial when yuh deal wid external API like Eleven Labs! If yuh look through di code, yuh wi see we implement several strategies:\n\nFirst, wi do basic checks before even making di request. Like inna `generateJamaicanVoice`, wi check if di API key exist first. If it nuh exist, wi return early with a fallback option: `shouldUseBrowserTTS: true` - which tell di app fi use di browser's built-in speech instead.\n\nWhen wi mek di actual API request, wi wrap everyting inna try-catch block fi catch any errors dat happen during di request or processing di response. Dis prevent di whole application from crash if someting go wrong.\n\nAfter wi get di response, wi check if di request successful using `response.ok`. If it not successful, wi throw custom error wid meaningful message. Inna `generateJamaicanVoice`, wi even read di error text from di response fi include it inna di error message.\n\nWhen exceptions happen, wi log dem properly with `console.error` so developers can troubleshoot, and wi also return structured error objects wid appropriate flags like `success: false` along wid human-readable error messages fi di user interface.\n\nDi ElevenLabsPlayer also set state variables like `isLoading` and `error` fi update di UI appropriately during di request lifecycle, showing loading indicators and error messages when necessary.\n\nOne more ting - inna some places wi implement fallback options, like using browser TTS when Eleven Labs nuh available. Dat way, even if someting go wrong, di user still get some kind of speech output."
    },
    {
      student: "What's the significance of the different voice IDs used in the application, and how would I add a new voice?",
      teacher: "Di different voice IDs inna di application represent unique voices wid different characteristics:\n\n\"EXAVITQu4vr4xnSDxMaL\" a di \"Oliva\" voice - one Caribbean voice weh wi use fi di authentic Jamaican experience. Dis voice have natural Caribbean inflections and accent patterns.\n\n\"21m00Tcm4TlvDq8ikWAM\" a di \"Rachel\" voice, which more neutral American-sounding voice, good fi general content.\n\nDi beauty of di ElevenLabsPlayer component is dat it also fetch all available voices when it mount, so users can select from any voice inna di Eleven Labs library.\n\nFi add a new voice, yuh have couple options:\n\n1. If yuh just want fi use another existing Eleven Labs voice, just change di VOICE_ID constant or pass a different voiceId prop to di component.\n\n2. If yuh want fi create yuh own custom voice, yuh need fi go to di Eleven Labs platform and either:\n   - Use dem \"Voice Design\" feature fi create new voice from scratch\n   - Use dem \"Voice Cloning\" fi upload samples of a voice yuh want fi clone\n   - Use dem \"Professional Voice Cloning\" service fi high-quality custom voices\n\nOnce yuh have di new voice created on di platform, yuh gwine get a new unique voice ID. Just replace di existing ID inna di code wid fi yuh new one, and di application gwine use dat voice instead.\n\nFi more dynamic implementations, yuh could also store multiple voice IDs inna configuration file or database and choose between dem based on context or user preferences."
    },
    {
      student: "How would stability, similarity_boost, and style settings affect the Jamaican voice output specifically?",
      teacher: "Fi di Jamaican voice specifically, dem settings have special importance:\n\n\"stability\" at 0.5 a very intentional choice fi Jamaican Creole. If wi did set it too high (like 0.9), di voice would sound too robotic and lose di natural rhythm of Jamaican speech - wi would lose di \"bounce\" weh make we patois special. If wi set it too low (like 0.1), di voice might get too unpredictable and exaggerate di accent to di point where it hard fi understand. Di middle value give wi natural Jamaican rhythm while keeping clarity.\n\n\"similarity_boost\" at 0.75 a higher dan di middle, and dat important fi preserve di authentic Caribbean characteristics of di original voice sample. If dis value too low, di AI might \"standardize\" di accent too much and lose di unique Jamaican sound features like our distinctive pitch patterns and syllable stress.\n\n\"style\" at 0.25 is interesting choice - we keep it relatively low because Jamaican Creole already have strong stylistic elements in di natural speech pattern. Setting style too high could make di voice sound like caricature rather dan authentic Jamaican. Wi want just enough style fi capture di cultural expressiveness without going overboard.\n\n\"use_speaker_boost\" set to true specifically help wid clarity, which especially important fi Jamaican voice because some listeners might not be familiar wid di accent. Dis setting help ensure di words remain clear even wid di unique pronunciation patterns.\n\nFi Jamaican voice specifically, dese settings balance authenticity wid comprehension - wi want di voice sound genuinely Jamaican but still be accessible fi all kinds of listeners, especially inna educational context."
    },
    {
      student: "What's the difference between using the direct fetch API approach and using the ElevenLabsClient library as seen in the code?",
      teacher: "Mi see both approaches inna di code, and dem have dem own advantages:\n\nDi direct fetch API approach (used inna `generateJamaicanVoice` and di TTS demo):\n- More lightweight since yuh nuh need fi load additional library\n- Give yuh full control over every aspect of di request\n- Make it clear exactly what going on wid di HTTP request\n- Better fi understanding di API structure and parameters\n- Sometimes easier fi troubleshoot because everyting explicit\n\nDi ElevenLabsClient library approach (used inna di ElevenLabsPlayer component):\n- More convenience - di library handle many details fi yuh\n- Better type safety if di library well-typed\n- May handle some edge cases automatically\n- Often provide helpful methods beyond just text-to-speech\n- Can automatically handle things like rate limiting, retries, etc.\n\nOne big difference mi notice in di implementation: di ElevenLabsClient return audio as a Readable stream, which wi have fi process chunk by chunk, while di direct fetch approach get di entire ArrayBuffer at once.\n\nWhich one better depend on di situation. Fi simple, direct use cases, di fetch approach might be simpler. But fi more complex applications wid many features of di Eleven Labs API, di client library can save time and reduce errors.\n\nInna we application, wi use both because dem serve different contexts - di direct approach good fi server-side in di `generateJamaicanVoice` function, while di client library work well inna di client-side component where we might want access to additional features."
    }
  ]);

  const handleNext = () => {
    if (!showTeacherResponse) {
      setShowTeacherResponse(true);
    } else if (currentIndex < dialogue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowTeacherResponse(false);
    }
  };

  const handlePrevious = () => {
    if (showTeacherResponse) {
      setShowTeacherResponse(false);
    } else if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowTeacherResponse(true);
    }
  };

  const handlePlayStudentAudio = async () => {
    if (isChunkProcessing) return;
    
    // Update the current dialogue entry to show loading state
    setDialogue(prev => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...updated[currentIndex],
        studentAudioStatus: 'loading'
      };
      return updated;
    });
    
    setIsChunkProcessing(true);
    setAudioProcessingError(null);
    
    try {
      const studentText = dialogue[currentIndex].student;
      
      // If we already have audio data, play it
      if (dialogue[currentIndex].studentAudioData) {
        const audio = new Audio(dialogue[currentIndex].studentAudioData);
        audio.play();
        
        setDialogue(prev => {
          const updated = [...prev];
          updated[currentIndex] = {
            ...updated[currentIndex],
            studentAudioStatus: 'success'
          };
          return updated;
        });
        
        setIsChunkProcessing(false);
        return;
      }
      
      // Request audio generation with student voice
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: studentText,
          useJamaicanVoice: true,
          voiceType: 'student' // Use student voice (male)
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.audioData) {
        // Play the audio
        const audio = new Audio(data.audioData);
        audio.play();
        
        // Store the audio data with the dialogue entry
        setDialogue(prev => {
          const updated = [...prev];
          updated[currentIndex] = {
            ...updated[currentIndex],
            studentAudioStatus: 'success',
            studentAudioData: data.audioData
          };
          return updated;
        });
      } else if (data.shouldUseBrowserTTS) {
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(studentText);
        utterance.lang = 'en-US'; // Standard English for student
        utterance.voice = getPreferredMaleVoice(); // Try to use a male voice
        utterance.rate = 0.9; // Slightly slower for clarity
        window.speechSynthesis.speak(utterance);
        
        setDialogue(prev => {
          const updated = [...prev];
          updated[currentIndex] = {
            ...updated[currentIndex],
            studentAudioStatus: 'success'
          };
          return updated;
        });
      } else {
        throw new Error(data.error || 'Failed to generate audio');
      }
    } catch (error) {
      console.error('Error playing student audio:', error);
      setAudioProcessingError((error as Error).message || 'Error playing audio');
      
      setDialogue(prev => {
        const updated = [...prev];
        updated[currentIndex] = {
          ...updated[currentIndex],
          studentAudioStatus: 'error'
        };
        return updated;
      });
      
      // Try browser TTS as fallback
      try {
        const utterance = new SpeechSynthesisUtterance(dialogue[currentIndex].student);
        utterance.lang = 'en-US'; // Standard English
        utterance.voice = getPreferredMaleVoice(); // Try to use a male voice
        window.speechSynthesis.speak(utterance);
      } catch (ttsError) {
        console.error('Browser TTS fallback also failed:', ttsError);
      }
    } finally {
      setIsChunkProcessing(false);
    }
  };

  // Helper function to get male voice for browser TTS fallback
  const getPreferredMaleVoice = () => {
    if (!window.speechSynthesis) return null;
    
    const voices = window.speechSynthesis.getVoices();
    
    // First try to find an English male voice
    const maleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('male') && 
      (voice.lang.startsWith('en-'))
    );
    
    // Fallback to any voice that might be male
    if (!maleVoice) {
      return voices.find(voice => 
        (voice.name.toLowerCase().includes('david') ||
         voice.name.toLowerCase().includes('james') ||
         voice.name.toLowerCase().includes('paul') ||
         voice.name.toLowerCase().includes('tom')) && 
        (voice.lang.startsWith('en-'))
      ) || null;
    }
    
    return maleVoice;
  };

  const handlePlayAudio = async () => {
    if (!showTeacherResponse || isChunkProcessing) return;
    
    // Update the current dialogue entry to show loading state
    setDialogue(prev => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...updated[currentIndex],
        audioStatus: 'loading'
      };
      return updated;
    });
    
    setIsChunkProcessing(true);
    setAudioProcessingError(null);
    
    try {
      const teacherText = dialogue[currentIndex].teacher;
      
      // If we already have audio data, play it
      if (dialogue[currentIndex].audioData) {
        const audio = new Audio(dialogue[currentIndex].audioData);
        audio.play();
        
        setDialogue(prev => {
          const updated = [...prev];
          updated[currentIndex] = {
            ...updated[currentIndex],
            audioStatus: 'success'
          };
          return updated;
        });
        
        setIsChunkProcessing(false);
        return;
      }
      
      // Process the full text instead of chunking
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: teacherText,
          useJamaicanVoice: true,
          voiceType: 'teacher' // Use teacher voice (Jamaican)
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.audioData) {
        // Play the audio
        const audio = new Audio(data.audioData);
        audio.play();
        
        // Store the audio data with the dialogue entry
        setDialogue(prev => {
          const updated = [...prev];
          updated[currentIndex] = {
            ...updated[currentIndex],
            audioStatus: 'success',
            audioData: data.audioData
          };
          return updated;
        });
      } else if (data.shouldUseBrowserTTS) {
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(teacherText);
        utterance.lang = 'en-JM'; // Jamaican English if available
        utterance.rate = 0.9; // Slightly slower for clarity
        window.speechSynthesis.speak(utterance);
        
        setDialogue(prev => {
          const updated = [...prev];
          updated[currentIndex] = {
            ...updated[currentIndex],
            audioStatus: 'success'
          };
          return updated;
        });
      } else {
        throw new Error(data.error || 'Failed to generate audio');
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioProcessingError((error as Error).message || 'Error playing audio');
      
      setDialogue(prev => {
        const updated = [...prev];
        updated[currentIndex] = {
          ...updated[currentIndex],
          audioStatus: 'error'
        };
        return updated;
      });
      
      // Try browser TTS as fallback
      try {
        const utterance = new SpeechSynthesisUtterance(dialogue[currentIndex].teacher);
        utterance.lang = 'en-JM'; // Try to use Jamaican English
        window.speechSynthesis.speak(utterance);
      } catch (ttsError) {
        console.error('Browser TTS fallback also failed:', ttsError);
      }
    } finally {
      setIsChunkProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Jamaican Voice Tutor Demo</h1>
      <p className="text-center mb-8 text-muted-foreground">
        Experience an interactive learning dialogue with a Jamaican Creole voice tutor. This demonstrates how the voice interface works with educational modules.
      </p>

      <Card className="w-full max-w-4xl mx-auto mb-8">
        <CardHeader>
          <CardTitle>Interactive Learning Dialogue</CardTitle>
          <CardDescription>
            Question {currentIndex + 1} of {dialogue.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">Student:</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePlayStudentAudio}
                disabled={isChunkProcessing || dialogue[currentIndex].studentAudioStatus === 'loading'}
                className="flex items-center gap-2"
              >
                {dialogue[currentIndex].studentAudioStatus === 'loading' ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <span>Play Audio</span>
                  </>
                )}
              </Button>
            </div>
            <p>{dialogue[currentIndex].student}</p>
          </div>

          {showTeacherResponse && (
            <div className="bg-primary/10 p-4 rounded-lg relative">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">Teacher:</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePlayAudio}
                  disabled={isChunkProcessing || dialogue[currentIndex].audioStatus === 'loading'}
                  className="flex items-center gap-2"
                >
                  {dialogue[currentIndex].audioStatus === 'loading' ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      <span>Play Audio</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="whitespace-pre-line">{dialogue[currentIndex].teacher}</p>
              
              {audioProcessingError && (
                <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">
                  <p className="font-semibold">Audio Error:</p>
                  <p>{audioProcessingError}</p>
                  <p className="mt-2">The audio is being processed in smaller chunks to improve reliability. 
                  You may experience delays or need to click Play Audio multiple times for longer responses.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentIndex === 0 && !showTeacherResponse}
          >
            Previous
          </Button>
          <Button onClick={handleNext}>
            {!showTeacherResponse ? 'Show Answer' : currentIndex < dialogue.length - 1 ? 'Next Question' : 'Finish'}
            {!showTeacherResponse && (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="ml-2"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="w-full max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">About Voice-Enhanced Learning</h2>
        <div className="bg-card p-5 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-3">How It Works</h3>
          <p className="mb-3">
            When you upload a PDF document to our system, we:
          </p>
          <ol className="list-decimal pl-5 space-y-2 mb-4">
            <li>Extract the key educational content</li>
            <li>Organize it into structured learning modules</li>
            <li>Generate interactive conversations to explain the content</li>
            <li>Deliver the explanations using authentic Jamaican Creole voice</li>
          </ol>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Voice Technology</h3>
          <p className="text-muted-foreground mb-2">
            Our voice technology enables a more engaging and culturally relevant learning experience:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li>Caribbean voice patterns for authentic Jamaican Creole delivery</li>
            <li>Natural language processing for conversational explanations</li>
            <li>Audio playback optimized for educational content</li>
            <li>Localized explanations that connect with Caribbean students</li>
            <li>Voice parameters tuned for clarity and engagement</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 