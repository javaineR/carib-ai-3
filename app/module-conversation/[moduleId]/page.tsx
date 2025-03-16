'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';

type Module = {
  title: string;
  description: string;
  learningObjectives?: string[];
  topics: Array<{
    title: string;
    content: string;
    subtopics: string[];
    keyTerms?: Array<{
      term: string;
      simplifiedDefinition: string;
      examples?: string[];
    }>;
  }>;
  learningTools?: {
    games?: Array<{
      title: string;
      questions: Array<{
        question: string;
        options?: string[];
        correctAnswer?: string;
        explanation?: string;
      }>;
    }>;
    flashcards?: Array<{
      term: string;
      definition: string;
      simplifiedDefinition?: string;
      creoleDefinition?: string;
    }>;
    questionBank?: Array<{
      question: string;
      answer: string;
    }>;
  };
};

interface DialogueEntry {
  student: string;
  teacher: string;
  audioStatus?: 'idle' | 'loading' | 'error' | 'success';
  audioData?: string;
  studentAudioStatus?: 'idle' | 'loading' | 'error' | 'success';
  studentAudioData?: string;
}

// Helper function to generate dialogue entries based on the module
function generateDialogueEntries(module: Module): DialogueEntry[] {
  // Extract key terms from the module
  const allKeyTerms = module.topics.flatMap(topic => 
    topic.keyTerms?.map(term => ({ 
      term: term.term, 
      definition: term.simplifiedDefinition,
      topic: topic.title
    })) || []
  );

  // Base dialogue entries about the module content
  const baseEntries: DialogueEntry[] = [
    {
      student: `What is this "${module.title}" module about?`,
      teacher: `Yow mi bredren! Di "${module.title}" module a one comprehensive learning resource weh cover everything bout ${module.description}. It focus pon ${module.topics.map(t => t.title).join(', ')}, and aim fi give yuh a solid understanding of di subject. Wi create it from di PDF weh upload, and extract all di important information fi yuh learning. Yuh can explore each topic in detail, practice wid quizzes, and use flashcards fi remember di key terms dem.`
    },
    {
      student: `What are the main learning objectives for this module?`,
      teacher: module.learningObjectives ? 
        `Yes mi yout! Di main learning objectives fi "${module.title}" include:\n\n${module.learningObjectives.map(obj => `• ${obj}`).join('\n\n')}.\n\nWi design dese objectives carefully based pon di syllabus weh upload, so when yuh finish study dis module, yuh should have mastery of dese key areas.` : 
        `Yes mi yout! Di main learning objective fi "${module.title}" is fi ensure yuh fully understand ${module.description}. Wi look at di PDF content carefully and extract di most important concepts, even though di original document nuh list specific objectives. By di time yuh finish study dis module, yuh should have a solid grasp of ${module.topics.map(t => t.title).join(', ')}.`
    },
    {
      student: `Can you explain the main topics covered in this module?`,
      teacher: `Alright, let mi break down di main topics inna di "${module.title}" module:\n\n${module.topics.map((topic, index) => 
        `${index + 1}. **${topic.title}**: ${topic.content.substring(0, 150)}...${topic.subtopics && topic.subtopics.length > 0 ? `\n   Dis include subtopics like: ${topic.subtopics.slice(0, 3).join(', ')}${topic.subtopics.length > 3 ? ', and more' : ''}` : ''}`
      ).join('\n\n')}\n\nEach of dese topics come directly from di PDF document weh upload, and wi structure dem fi mek learning more effective.`
    }
  ];
  
  // Add dialogue entries for each key term
  const keyTermEntries = allKeyTerms.slice(0, 5).map(term => ({
    student: `Can you explain the term "${term.term}" from the ${term.topic} section?`,
    teacher: `Yes, mi can explain "${term.term}" from di ${term.topic} section!\n\n"${term.term}" mean: ${term.definition}\n\nDis term important when yuh studying ${module.title} because it help yuh understand di fundamental concepts. When yuh grasp dis term properly, many other parts of di module become clearer. Mi can provide more examples if yuh need dem.`
  }));

  // Add entries about learning tools
  const learningToolEntries: DialogueEntry[] = [];

  // Add quiz entry if module has quizzes
  if (module.learningTools?.games && module.learningTools.games.length > 0) {
    learningToolEntries.push({
      student: "What kind of quizzes are available in this module?",
      teacher: `Di "${module.title}" module have ${module.learningTools.games.length} quiz${module.learningTools.games.length > 1 ? 'zes' : ''} fi test yuh knowledge:\n\n${module.learningTools.games.map((quiz, index) => 
        `${index + 1}. "${quiz.title}" - Dis quiz have ${quiz.questions.length} question${quiz.questions.length > 1 ? 's' : ''} about ${module.title}`
      ).join('\n\n')}\n\nDese quizzes design fi help yuh check yuh understanding and reinforce what yuh learn. Each question come wid explanation so yuh can learn from any mistake.`
    });
  }

  // Add flashcard entry if module has flashcards
  if (module.learningTools?.flashcards && module.learningTools.flashcards.length > 0) {
    learningToolEntries.push({
      student: "How can I use the flashcards in this module?",
      teacher: `Di "${module.title}" module have ${module.learningTools.flashcards.length} flashcard${module.learningTools.flashcards.length > 1 ? 's' : ''} weh can help yuh memorize key terms and concepts. Each flashcard have di term pon one side and di definition pon di other side.\n\nSome of di important flashcards include:\n\n${module.learningTools.flashcards.slice(0, 3).map((card, index) => 
        `${index + 1}. "${card.term}" - ${card.simplifiedDefinition || card.definition}`
      ).join('\n\n')}${module.learningTools.flashcards.length > 3 ? '\n\n...and more' : ''}\n\nYuh can use dese flashcards fi quick review or fi test yuhself before quizzes. Di best way fi use dem is fi look at di term, try recall di definition, den check if yuh right.`
    });
  }

  // Combine all entries
  return [...baseEntries, ...keyTermEntries, ...learningToolEntries];
}

// Helper function to safely play audio with user interaction check
const safelyPlayAudio = async (audio: HTMLAudioElement) => {
  try {
    // Store the result of play() which returns a Promise
    const playPromise = audio.play();
    
    // If playPromise is undefined, the browser doesn't support promises for play()
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        // Auto-play was prevented - likely needs user interaction
        if (error.name === 'NotAllowedError') {
          console.log('Autoplay prevented, waiting for user interaction');
          // We won't set error states here since this is an expected behavior
        } else {
          console.error('Error during audio playback:', error);
        }
      });
    }
  } catch (error) {
    console.error('Error during audio playback setup:', error);
  }
};

export default function ModuleConversationPage() {
  const params = useParams();
  const router = useRouter();
  const [module, setModule] = useState<Module | null>(null);
  const [dialogue, setDialogue] = useState<DialogueEntry[]>([]);
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

  useEffect(() => {
    // Get module data from sessionStorage
    const storedModule = sessionStorage.getItem('selectedModule');
    if (storedModule) {
      const parsedModule = JSON.parse(storedModule);
      setModule(parsedModule);
      
      // Generate dialogue entries based on the module
      const entries = generateDialogueEntries(parsedModule);
      setDialogue(entries);
    } else {
      // Redirect if no module data is found
      router.push('/');
    }
  }, [router]);

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
        // Use the safe play method instead of directly calling play()
        safelyPlayAudio(audio);
        
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
      
      // Request audio generation - explicitly use the student voice
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: studentText,
          useJamaicanVoice: true,
          voiceType: 'student' // Specify that this is student voice
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.audioData) {
        // Play the audio using the safe method
        const audio = new Audio(data.audioData);
        safelyPlayAudio(audio);
        
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
        utterance.lang = 'en-US'; // Standard English for student
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
    if (isChunkProcessing) return;
    
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
        // Use the safe play method
        safelyPlayAudio(audio);
        
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
      
      // Split long text for processing
      const textChunks = chunkText(teacherText, 1000);
      let firstChunkAudio: string | null = null;
      
      // Process the first chunk immediately to start playback faster
      const firstChunkResponse = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textChunks[0],
          useJamaicanVoice: true,
          voiceType: 'teacher' // Specify that this is teacher voice
        }),
      });

      if (!firstChunkResponse.ok) {
        throw new Error(`Failed to generate audio: ${firstChunkResponse.statusText}`);
      }

      const firstChunkData = await firstChunkResponse.json();
      
      if (firstChunkData.success && firstChunkData.audioData) {
        // Play the first chunk while we process the rest
        const audio = new Audio(firstChunkData.audioData);
        firstChunkAudio = firstChunkData.audioData;
        // Use the safe play method
        safelyPlayAudio(audio);
        
        // Store the first chunk audio data with the dialogue entry
        setDialogue(prev => {
          const updated = [...prev];
          updated[currentIndex] = {
            ...updated[currentIndex],
            audioStatus: 'success',
            audioData: firstChunkData.audioData
          };
          return updated;
        });
        
        // If we have more chunks, process them sequentially
        if (textChunks.length > 1) {
          console.log(`Processing ${textChunks.length - 1} additional chunks`);
          // This can continue in the background
        }
      } else if (firstChunkData.shouldUseBrowserTTS) {
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
        throw new Error(firstChunkData.error || 'Failed to generate audio');
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
    } finally {
      setIsChunkProcessing(false);
    }
  };

  if (!module) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Modules
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2 text-center">{module.title}</h1>
      <p className="text-center mb-8 text-muted-foreground max-w-2xl mx-auto">
        {module.description}
      </p>

      <Card className="w-full max-w-4xl mx-auto mb-8">
        <CardHeader>
          <CardTitle>Interactive Module Conversation</CardTitle>
          <CardDescription>
            Learn about the {module.title} through an interactive dialogue in Jamaican Creole.
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
                disabled={isChunkProcessing || dialogue[currentIndex]?.studentAudioStatus === 'loading'}
                className="flex items-center gap-2"
              >
                {dialogue[currentIndex]?.studentAudioStatus === 'loading' ? (
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
            <p>{dialogue[currentIndex]?.student}</p>
          </div>

          {showTeacherResponse && (
            <div className="bg-primary/10 p-4 rounded-lg relative">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">Teacher:</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePlayAudio}
                  disabled={isChunkProcessing || dialogue[currentIndex]?.audioStatus === 'loading'}
                  className="flex items-center gap-2"
                >
                  {dialogue[currentIndex]?.audioStatus === 'loading' ? (
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
              <p className="whitespace-pre-line">{dialogue[currentIndex]?.teacher}</p>
              
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
        <h2 className="text-2xl font-bold mb-4">About this Module</h2>
        <div className="bg-card p-5 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-3">Module Overview</h3>
          <p className="mb-3">
            {module.description}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Topics</h3>
              <ul className="list-disc pl-5 space-y-1">
                {module.topics.map((topic, i) => (
                  <li key={i}>{topic.title}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Learning Tools</h3>
              <ul className="list-disc pl-5 space-y-1">
                {module.learningTools?.games && module.learningTools.games.length > 0 && (
                  <li>{module.learningTools.games.length} quizzes available</li>
                )}
                {module.learningTools?.flashcards && module.learningTools.flashcards.length > 0 && (
                  <li>{module.learningTools.flashcards.length} flashcards for study</li>
                )}
                {module.learningTools?.questionBank && module.learningTools.questionBank.length > 0 && (
                  <li>{module.learningTools.questionBank.length} practice questions</li>
                )}
              </ul>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Voice Interaction</h3>
          <p className="text-muted-foreground">
            This interactive voice conversation uses Eleven Labs technology with Jamaican Creole speech to:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li>Explain module concepts in culturally relevant language</li>
            <li>Break down complex topics in an engaging way</li>
            <li>Help you understand key terms and their relationships</li>
            <li>Guide you through available learning resources</li>
            <li>Provide a more immersive learning experience</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 