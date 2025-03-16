"use client"

import { useState, useRef, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Edit, Save, X, FileDown, Book, BookOpen, GamepadIcon, Lightbulb, HelpCircle, MessageSquare, Trash2, Volume2, VolumeX } from "lucide-react"
import { translateTerm, updateModule, answerQuestion, deleteModule, evaluateQuizAnswer, generateJamaicanVoice } from "@/app/client-actions"
import TermTranslator from "./term-translator"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { ModuleVoiceConversation } from './module-voice-conversation';
import Link from "next/link"

type Question = {
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
  difficulty?: "easy" | "medium" | "hard"
  tags?: string[]
}

type Quiz = {
  title: string
  questions: Question[]
}

type KeyTerm = {
  term: string
  simplifiedDefinition: string
  examples?: string[]
  translatedDefinition?: string
}

type Topic = {
  title: string
  content: string
  subtopics: string[]
  keyTerms?: KeyTerm[]
}

type Flashcard = {
  term: string
  definition: string
  simplifiedDefinition?: string
  creoleDefinition?: string
}

type QAItem = {
  question: string
  answer: string
}

type Module = {
  title: string
  description: string
  learningObjectives?: string[]
  topics: Topic[]
  learningTools: {
    games: Quiz[]
    flashcards: Flashcard[]
    questionBank: QAItem[]
  }
}

export default function ModulesList({ initialModules }: { initialModules: Module[] }) {
  // Check if initialModules is an array
  if (!Array.isArray(initialModules)) {
    initialModules = [];
  }
  
  // If the initialModules contains an "Example Module", but we have more than one module,
  // filter out the example module (it's likely a default that snuck in)
  if (initialModules.length > 1) {
    const exampleModuleIndex = initialModules.findIndex(m => m.title === "Example Module");
    if (exampleModuleIndex >= 0) {
      initialModules = initialModules.filter((_, i) => i !== exampleModuleIndex);
    }
  }
  
  // Ensure each module has the proper structure
  const safeInitialModules = initialModules.map(module => ensureValidModuleStructure(module));
  
  const [modules, setModules] = useState<Module[]>(safeInitialModules);
  const [editingModule, setEditingModule] = useState<{ index: number; content: string } | null>(null)
  const [activeTab, setActiveTab] = useState<string>("modules")
  const [selectedModule, setSelectedModule] = useState<number | null>(0)
  const [selectedLearningTool, setSelectedLearningTool] = useState<string>("modules")
  const [quizState, setQuizState] = useState<{
    currentQuiz: number | null
    currentQuestion: number
    selectedAnswer: string | null
    showResults: boolean
    correctAnswers: number
    aiEvaluation: string | null
    isEvaluating: boolean
    feedback: string | null
  }>({
    currentQuiz: null,
    currentQuestion: 0,
    selectedAnswer: null,
    showResults: false,
    correctAnswers: 0,
    aiEvaluation: null,
    isEvaluating: false,
    feedback: null
  })
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false)
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0)
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false)
  const [userQuestion, setUserQuestion] = useState("")
  const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null)
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false)
  const [isTranslating, setIsTranslating] = useState<boolean>(false)
  const [jamaicanAudio, setJamaicanAudio] = useState<string | null>(null)
  const [isGeneratingJamaicanVoice, setIsGeneratingJamaicanVoice] = useState<boolean>(false)
  
  // Speech synthesis state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Function to ensure valid module structure
  function ensureValidModuleStructure(module: any): Module {
    return {
      title: module.title || "Untitled Module",
      description: module.description || "No description provided",
      learningObjectives: Array.isArray(module.learningObjectives) ? module.learningObjectives : [],
      topics: Array.isArray(module.topics) ? module.topics.map((topic: any) => ({
        title: topic.title || "Untitled Topic",
        content: topic.content || "No content provided",
        subtopics: Array.isArray(topic.subtopics) ? topic.subtopics : [],
        keyTerms: Array.isArray(topic.keyTerms) ? topic.keyTerms : []
      })) : [],
      learningTools: {
        games: Array.isArray(module.learningTools?.games) ? module.learningTools.games : [],
        flashcards: Array.isArray(module.learningTools?.flashcards) ? module.learningTools.flashcards : [],
        questionBank: Array.isArray(module.learningTools?.questionBank) ? module.learningTools.questionBank : []
      }
    };
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No modules have been generated yet. Upload a syllabus to get started.</p>
      </div>
    )
  }

  const handleEdit = (index: number) => {
    setEditingModule({
      index,
      content: JSON.stringify(modules[index], null, 2),
    })
  }

  const handleSave = async () => {
    if (!editingModule) return

    try {
      const updatedContent = JSON.parse(editingModule.content)
      const newModules = [...modules]
      newModules[editingModule.index] = updatedContent
      setModules(newModules)

      // Client-side implementation
      const result = await updateModule(editingModule.index, editingModule.content)
      if (result.success) {
        setEditingModule(null)
      }
    } catch (error) {
      console.error("Error saving module:", error)
      alert("Invalid JSON format. Please check your edits.")
    }
  }

  const handleCancel = () => {
    setEditingModule(null)
  }

  const handleDownload = (module: Module) => {
    const content = JSON.stringify(module, null, 2)
    const blob = new Blob([content], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${module.title.replace(/\s+/g, "_")}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSelectModule = (index: number) => {
    setSelectedModule(index);
    setSelectedLearningTool("modules");
    resetQuiz();
  }

  const handleSelectLearningTool = (tool: string) => {
    setSelectedLearningTool(tool);
    if (tool === "games" && modules[selectedModule || 0].learningTools.games.length > 0) {
      resetQuiz();
    }
    if (tool === "flashcards") {
      setCurrentFlashcardIndex(0);
      setShowFlashcardAnswer(false);
    }
  }

  const resetQuiz = () => {
    setQuizState({
      currentQuiz: null,
      currentQuestion: 0,
      selectedAnswer: null,
      showResults: false,
      correctAnswers: 0,
      aiEvaluation: null,
      isEvaluating: false,
      feedback: null
    });
  }

  const startQuiz = (quizIndex: number) => {
    // Make sure the quiz has questions
    const quiz = modules[selectedModule || 0].learningTools.games[quizIndex];
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return;
    }
    
    // Ensure we load all questions by explicitly assigning the quiz
    setQuizState({
      currentQuiz: quizIndex,
      currentQuestion: 0,
      selectedAnswer: null,
      showResults: false,
      correctAnswers: 0,
      aiEvaluation: null,
      isEvaluating: false,
      feedback: null
    });
  }

  const handleAnswerSelect = (answer: string) => {
    setQuizState({...quizState, selectedAnswer: answer});
  }

  const checkAnswer = async () => {
    if (quizState.currentQuiz === null || quizState.selectedAnswer === null) return;
    
    const currentQuiz = modules[selectedModule || 0].learningTools.games[quizState.currentQuiz];
    const currentQuestion = currentQuiz.questions[quizState.currentQuestion];
    
    setQuizState({
      ...quizState,
      isEvaluating: true
    });
    
    try {
      // Use the client-side version of evaluateQuizAnswer
      const result = await evaluateQuizAnswer(
        currentQuestion.question,
        currentQuestion.options[parseInt(quizState.selectedAnswer)],
        currentQuestion.correctAnswer
      );
      
      if (result.success) {
        setQuizState({
          ...quizState,
          correctAnswers: result.isCorrect ? quizState.correctAnswers + 1 : quizState.correctAnswers,
          feedback: result.feedback,
          isEvaluating: false
        });
      } else {
        // Fallback to simple matching if API call fails
        const simpleIsCorrect = currentQuestion.options[parseInt(quizState.selectedAnswer)] === currentQuestion.correctAnswer;
        
        setQuizState({
          ...quizState, 
          correctAnswers: simpleIsCorrect ? quizState.correctAnswers + 1 : quizState.correctAnswers,
          feedback: simpleIsCorrect ? "Correct! Well done." : `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`,
          isEvaluating: false
        });
      }
    } catch (error) {
      console.error("Error checking answer:", error);
      
      // Fallback to simple string matching
      const simpleIsCorrect = currentQuestion.options[parseInt(quizState.selectedAnswer)] === currentQuestion.correctAnswer;
      
      setQuizState({
        ...quizState, 
        correctAnswers: simpleIsCorrect ? quizState.correctAnswers + 1 : quizState.correctAnswers,
        feedback: simpleIsCorrect ? "Correct! Well done." : `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`,
        isEvaluating: false
      });
    }
  }

  const handleNextQuestion = () => {
    const currentQuiz = modules[selectedModule || 0].learningTools.games[quizState.currentQuiz || 0];
    
    if (quizState.currentQuestion < currentQuiz.questions.length - 1) {
      setQuizState({
        ...quizState,
        currentQuestion: quizState.currentQuestion + 1,
        selectedAnswer: null,
        feedback: null
      });
    } else {
      setQuizState({
        ...quizState,
        showResults: true
      });
    }
  }

  const handleTranslate = async (term: KeyTerm) => {
    setIsTranslating(true);
    
    try {
      // Use the client-side version of translateTerm
      const result = await translateTerm(term.term, term.simplifiedDefinition);
      
      if (result.success) {
        // Update the term with the translation
        const updatedModules = [...modules];
        const moduleIndex = selectedModule || 0;
        const topicIndex = updatedModules[moduleIndex].topics.findIndex(
          topic => topic.keyTerms?.some(kt => kt.term === term.term)
        );
        
        if (topicIndex !== -1) {
          const keyTermIndex = updatedModules[moduleIndex].topics[topicIndex].keyTerms?.findIndex(
            kt => kt.term === term.term
          );
          
          if (keyTermIndex !== -1 && updatedModules[moduleIndex].topics[topicIndex].keyTerms) {
            updatedModules[moduleIndex].topics[topicIndex].keyTerms![keyTermIndex].translatedDefinition = result.translation;
            setModules(updatedModules);
          }
        }
      }
    } catch (error) {
      console.error("Error translating term:", error);
    } finally {
      setIsTranslating(false);
    }
  }

  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) return;
    
    setIsGeneratingAnswer(true);
    
    try {
      const moduleContext = modules[selectedModule || 0].title;
      
      // Use the client-side version of answerQuestion
      const result = await answerQuestion(userQuestion, moduleContext);
      
      if (result.success) {
        setGeneratedAnswer(result.answer);
      } else {
        setGeneratedAnswer("Sorry, I couldn't generate an answer at this time. Please try again later.");
      }
    } catch (error) {
      console.error("Error generating answer:", error);
      setGeneratedAnswer("An error occurred while generating the answer. Please try again.");
    } finally {
      setIsGeneratingAnswer(false);
    }
  }

  const handleDeleteModule = async (index: number) => {
    if (window.confirm("Are you sure you want to delete this module? This action cannot be undone.")) {
      try {
        // Use the client-side version of deleteModule
        const result = await deleteModule(index);
        
        if (result.success) {
          const newModules = [...modules];
          newModules.splice(index, 1);
          setModules(newModules);
          
          if (selectedModule === index) {
            setSelectedModule(newModules.length > 0 ? 0 : null);
          } else if (selectedModule !== null && selectedModule > index) {
            setSelectedModule(selectedModule - 1);
          }
        }
      } catch (error) {
        console.error("Error deleting module:", error);
        alert("Error deleting module. Please try again.");
      }
    }
  }

  const handlePlayJamaicanVoice = async (text: string, isCreole: boolean = false) => {
    setIsGeneratingJamaicanVoice(true);
    
    try {
      // Use the client-side version of generateJamaicanVoice
      const result = await generateJamaicanVoice(text, isCreole);
      
      if (result.success && !result.shouldUseBrowserTTS) {
        // If we got an audio URL, play it
        setJamaicanAudio(result.audioUrl);
        
        if (audioRef.current) {
          audioRef.current.src = result.audioUrl;
          audioRef.current.play();
        } else {
          const audio = new Audio(result.audioUrl);
          audio.play();
          audioRef.current = audio;
        }
      } else {
        // Fallback to browser TTS
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'en-US';
          utterance.rate = 0.9;
          
          speechSynthesis.cancel();
          speechSynthesis.speak(utterance);
          speechSynthesisRef.current = utterance;
          setIsSpeaking(true);
          
          utterance.onend = () => {
            setIsSpeaking(false);
          };
        }
      }
    } catch (error) {
      console.error("Error generating Jamaican voice:", error);
      
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
        speechSynthesisRef.current = utterance;
        setIsSpeaking(true);
        
        utterance.onend = () => {
          setIsSpeaking(false);
        };
      }
    } finally {
      setIsGeneratingJamaicanVoice(false);
    }
  }

  const stopSpeaking = () => {
    if (speechSynthesisRef.current && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }

  // Return the component JSX
  return (
    <div className="container mx-auto py-6">
      {/* Rest of the component JSX */}
    </div>
  );
}

