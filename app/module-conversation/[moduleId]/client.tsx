"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, Send, ArrowLeft, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';

// Define types for message structure
type MessageType = 'user' | 'assistant';

interface Message {
  type: MessageType;
  content: string;
  timestamp: Date;
}

// Mock AI tutor responses based on module topics
const mockResponses: Record<string, string[]> = {
  "ai-basics": [
    "Artificial Intelligence is a field of computer science focused on creating systems that can perform tasks normally requiring human intelligence.",
    "Machine Learning is a subset of AI that allows systems to learn from data and improve their performance without being explicitly programmed.",
    "Neural networks are computing systems inspired by the biological neural networks in human brains, consisting of nodes (neurons) connected in layers.",
    "AI ethics involves considerations about fairness, transparency, privacy, and the social impact of artificial intelligence systems."
  ],
  "prompt-engineering": [
    "Prompt engineering is the process of designing effective inputs for language models to produce desired outputs.",
    "Few-shot learning involves providing examples within your prompt to guide the AI in producing similar responses.",
    "Chain of thought prompting helps break down complex reasoning into step-by-step thinking processes.",
    "Temperature controls the randomness in AI responses - higher values create more creative but potentially less accurate outputs."
  ],
  "module-1": [
    "This is content from module 1. It contains basic concepts and introductory material.",
    "Module 1 covers fundamental principles that will be expanded upon in later modules.",
    "The key learning objectives for module 1 include understanding core terminology and basic processes.",
    "Make sure to complete the practice exercises in module 1 before moving on to more advanced material."
  ],
  "module-2": [
    "Module 2 builds on the concepts introduced in module 1 with intermediate level content.",
    "In module 2, we explore practical applications of the theories covered previously.",
    "The exercises in module 2 are designed to challenge your understanding and develop problem-solving skills.",
    "By the end of module 2, you should be able to apply the concepts in real-world scenarios."
  ],
  "module-3": [
    "Module 3 contains advanced material for those who have mastered the basics.",
    "This module explores complex interactions between different concepts and systems.",
    "The case studies in module 3 represent real-world challenges and solutions.",
    "After completing module 3, you'll have a comprehensive understanding of the entire subject area."
  ]
};

// Generic responses for any module
const genericResponses = [
  "That's an interesting question! Let me explain...",
  "Great question. The key thing to understand is...",
  "I'd be happy to help you with that. Let's break it down...",
  "That's a common area of confusion. Here's what you need to know...",
  "Let me clarify that concept for you..."
];

export function ModuleConversationClient({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [moduleData, setModuleData] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Initialize the conversation with a welcome message
  useEffect(() => {
    // Try to get module data from session storage
    const storedModule = typeof window !== 'undefined' ? sessionStorage.getItem('selectedModule') : null;
    let moduleInfo;
    
    if (storedModule) {
      try {
        moduleInfo = JSON.parse(storedModule);
        setModuleData(moduleInfo);
      } catch (error) {
        console.error("Failed to parse stored module data", error);
      }
    }
    
    // Add initial message
    const initialMessage: Message = {
      type: 'assistant',
      content: moduleInfo 
        ? `Welcome to the ${moduleInfo.title} module conversation! I'm your AI tutor. How can I help you learn about ${moduleInfo.title.toLowerCase()}?`
        : `Welcome to the module conversation! I'm your AI tutor. How can I help you with your learning?`,
      timestamp: new Date()
    };
    
    setMessages([initialMessage]);
    
    // Initialize speech synthesis
    if (typeof window !== 'undefined') {
      speechSynthesisRef.current = new SpeechSynthesisUtterance();
      speechSynthesisRef.current.rate = 1;
      speechSynthesisRef.current.pitch = 1;
      
      // Stop speaking when navigating away
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const generateResponse = (userMessage: string): string => {
    // Simple response generation based on the module
    if (!moduleId) return "I'm not sure which module you're asking about. Could you be more specific?";
    
    // Check if we have specific responses for this module
    const moduleResponses = mockResponses[moduleId] || [];
    
    // Create a combined pool of responses
    const possibleResponses = [...moduleResponses, ...genericResponses];
    
    // Pick a random response from the pool
    return possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
  };
  
  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;
    
    // Add user message
    const userMessage: Message = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      const aiResponse = generateResponse(userMessage.content);
      
      const assistantMessage: Message = {
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
      
      // Speak the response if audio is enabled
      if (audioEnabled) {
        speakText(aiResponse);
      }
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Speech synthesis functions
  const speakText = (text: string) => {
    if (!speechSynthesisRef.current || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Set the text to speak
    speechSynthesisRef.current.text = text;
    
    // Start speaking
    window.speechSynthesis.speak(speechSynthesisRef.current);
    setIsSpeaking(true);
    
    // Update state when speech ends
    speechSynthesisRef.current.onend = () => {
      setIsSpeaking(false);
    };
  };
  
  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    } else {
      // Find the last AI message and speak it
      const lastAiMessage = [...messages].reverse().find(m => m.type === 'assistant');
      if (lastAiMessage) {
        speakText(lastAiMessage.content);
      }
    }
  };
  
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (isSpeaking && !audioEnabled) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  };
  
  const toggleListening = () => {
    // This would normally connect to the Web Speech API
    // For now, we'll just toggle the state
    setIsListening(!isListening);
    
    // Mock implementation - in a real app, this would use the SpeechRecognition API
    if (!isListening) {
      // Start listening
      setTimeout(() => {
        setIsListening(false);
        setInputMessage("Can you explain this topic in simpler terms?");
      }, 3000);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href={`/learning-lab/module/${moduleId}`}
              className="flex items-center text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Module
            </Link>
            
            {moduleData && (
              <div className="hidden md:block">
                <h1 className="text-xl font-bold">{moduleData.title} - AI Tutor Chat</h1>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleAudio}
              className={`rounded-full ${!audioEnabled ? 'text-gray-500' : 'text-blue-500'}`}
            >
              {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleSpeech}
              className={`rounded-full ${isSpeaking ? 'text-blue-500 bg-blue-900/30' : 'text-gray-300'}`}
              disabled={!audioEnabled}
            >
              <Volume2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className={`h-8 w-8 ${message.type === 'user' ? 'ml-2' : 'mr-2'}`}>
                      {message.type === 'assistant' ? (
                        <>
                          <AvatarFallback className="bg-blue-600">AI</AvatarFallback>
                          <AvatarImage src="/images/ai-avatar.png" />
                        </>
                      ) : (
                        <>
                          <AvatarFallback className="bg-purple-600">U</AvatarFallback>
                          <AvatarImage src="/images/user-avatar.png" />
                        </>
                      )}
                    </Avatar>
                    
                    <Card className={`
                      ${message.type === 'user' 
                        ? 'bg-purple-600 border-purple-500' 
                        : 'bg-blue-600 border-blue-500'}
                      mb-2
                    `}>
                      <CardContent className="p-3">
                        <p className="text-white">{message.content}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex flex-row">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback className="bg-blue-600">AI</AvatarFallback>
                      <AvatarImage src="/images/ai-avatar.png" />
                    </Avatar>
                    
                    <Card className="bg-blue-600 border-blue-500 mb-2">
                      <CardContent className="p-3">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 rounded-full bg-blue-200 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-blue-200 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-blue-200 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
              
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Message Input */}
          <div className="p-4 border-t border-gray-800">
            <div className="max-w-5xl mx-auto flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={toggleListening}
              >
                {isListening ? (
                  <Mic className="h-5 w-5 text-green-500" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </Button>
              
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your question..."
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              
              <Button 
                onClick={handleSendMessage}
                disabled={inputMessage.trim() === '' || isLoading}
                className={`rounded-full ${
                  inputMessage.trim() === '' || isLoading 
                    ? 'bg-gray-700 text-gray-400' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 