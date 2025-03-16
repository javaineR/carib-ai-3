"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Volume2, VolumeX, Send, ArrowLeft } from "lucide-react"
import Link from "next/link"
import ChatAnalytics from "@/components/chat-analytics"
import { getGeneratedModules } from "../actions"
import type { Module } from "../../types/module"

// Message type for chat
type Message = {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ConversationPage() {
  const searchParams = useSearchParams()
  const moduleParam = searchParams?.get("module")
  const moduleIndex = moduleParam ? parseInt(moduleParam) : null
  
  const [modules, setModules] = useState<Module[]>([])
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatData, setChatData] = useState<string[][]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Fetch modules when component mounts
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const fetchedModules = await getGeneratedModules();
        setModules(fetchedModules || []);
        
        // Select module if index is provided
        if (moduleIndex !== null && fetchedModules && fetchedModules[moduleIndex]) {
          setSelectedModule(fetchedModules[moduleIndex]);
          
          // Add initial welcome message
          const initialMessage = {
            role: "assistant" as const,
            content: `Welcome to the conversation about "${fetchedModules[moduleIndex].title}". What would you like to discuss about this topic?`,
            timestamp: new Date()
          };
          setMessages([initialMessage]);
        }
      } catch (error) {
        console.error("Error fetching modules:", error);
      }
    };
    
    fetchModules();
  }, [moduleIndex]);

  // Extract terms and keywords from user messages to build chat data for analysis
  useEffect(() => {
    const userMessages = messages.filter(m => m.role === "user");
    if (userMessages.length < 2) return; // Need at least 2 messages for meaningful patterns
    
    // Extract keywords from each message using simple word extraction
    // This is a simplified approach - in a real app, you might use NLP techniques
    const keywords = userMessages.map(message => {
      const words = message.content
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3) // Filter out small words
        .filter(word => !["about", "would", "could", "should", "there", "their", "these", "those", "which", "where"].includes(word)); // Filter common words
      
      // Add terms from the selected module if available
      if (selectedModule) {
        const moduleTerms = selectedModule.topics
          .flatMap(topic => topic.keyTerms || [])
          .map(term => term.term.toLowerCase());
        
        // Find module terms in the message
        const foundTerms = moduleTerms.filter(term => 
          message.content.toLowerCase().includes(term)
        );
        
        // Combine unique words and found terms
        return Array.from(new Set([...words, ...foundTerms]));
      }
      
      return Array.from(new Set(words)); // Return unique words
    });
    
    setChatData(keywords);
  }, [messages, selectedModule]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message and get AI response
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    
    try {
      // In a real app, you would call an API here
      // For demo, we'll simulate a response based on the selected module
      let response = "I'm not sure how to respond to that.";
      
      if (selectedModule) {
        // Simple matching algorithm to find relevant content in the module
        const query = inputMessage.toLowerCase();
        let bestMatch = { text: "", score: 0 };
        
        // Check topics
        selectedModule.topics.forEach(topic => {
          const content = topic.content.toLowerCase();
          const matchScore = calculateMatchScore(query, content);
          if (matchScore > bestMatch.score) {
            bestMatch = { text: topic.content, score: matchScore };
          }
          
          // Check key terms
          (topic.keyTerms || []).forEach(term => {
            if (query.includes(term.term.toLowerCase())) {
              bestMatch = { text: term.simplifiedDefinition, score: 0.8 };
            }
          });
        });
        
        // Check question bank
        selectedModule.learningTools.questionBank.forEach(qa => {
          const questionMatch = calculateMatchScore(query, qa.question.toLowerCase());
          if (questionMatch > 0.5) {
            bestMatch = { text: qa.answer, score: 0.9 };
          }
        });
        
        response = bestMatch.score > 0.3 
          ? bestMatch.text 
          : `I don't have specific information about that in the "${selectedModule.title}" module. Would you like to explore another topic?`;
      }
      
      // Add assistant response with a small delay to feel more natural
      setTimeout(() => {
        const assistantMessage: Message = {
          role: "assistant",
          content: response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error getting response:", error);
      setIsLoading(false);
    }
  };

  // Simple text matching algorithm
  const calculateMatchScore = (query: string, text: string): number => {
    const queryWords = query.split(/\s+/);
    let matchCount = 0;
    
    queryWords.forEach(word => {
      if (word.length > 3 && text.includes(word)) {
        matchCount++;
      }
    });
    
    return matchCount / queryWords.length;
  };

  // Text to speech function
  const speakText = (text: string) => {
    try {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      if (!speechSynthesisRef.current) {
        speechSynthesisRef.current = new SpeechSynthesisUtterance();
      }

      const utterance = speechSynthesisRef.current;
      utterance.text = text;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      // Try to set a good voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const englishVoice = voices.find(voice => 
          voice.lang.includes('en') && voice.name.includes('Female')
        ) || voices.find(voice => 
          voice.lang.includes('en')
        ) || voices[0];
        
        utterance.voice = englishVoice;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Error with text-to-speech:", error);
      setIsSpeaking(false);
    }
  };

  // Handle key press (Enter to send message)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center mb-6">
        <Link href="/modules" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mr-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Modules
        </Link>
        <h1 className="text-2xl font-bold flex-1">
          {selectedModule ? `Conversation: ${selectedModule.title}` : 'Interactive Learning Conversation'}
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle>{selectedModule ? selectedModule.title : 'Chat'}</CardTitle>
              <CardDescription>
                {selectedModule 
                  ? `Discuss and learn about ${selectedModule.title}`
                  : 'Select a module to start a focused conversation'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden flex flex-col">
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto pr-4 space-y-4 mb-4"
              >
                {messages.map((message, index) => (
                  <div 
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] px-4 py-2 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        
                        {message.role === 'assistant' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 ml-2 -mt-1" 
                            onClick={() => speakText(message.content)}
                          >
                            {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                            <span className="sr-only">{isSpeaking ? "Stop speaking" : "Read aloud"}</span>
                          </Button>
                        )}
                      </div>
                      
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="px-4 py-2 rounded-lg bg-muted">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-end gap-2 mt-auto">
                <Textarea
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1 resize-none"
                  rows={2}
                  disabled={!selectedModule || isLoading}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !selectedModule || isLoading}
                  className="mb-1"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Analytics area */}
        <div className="lg:col-span-1">
          <ChatAnalytics 
            chatData={chatData} 
            modules={modules} 
            onSuggestModules={(patterns) => {
              if (patterns.length > 0 && !isLoading) {
                const patternStr = patterns.slice(0, 3).map(p => p.pattern.join(', ')).join('; ');
                const assistantMessage: Message = {
                  role: "assistant",
                  content: `I notice you're interested in ${patternStr}. Would you like to explore these topics further?`,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
              }
            }}
          />
        </div>
      </div>
    </div>
  )
} 