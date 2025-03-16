"use client"

import { useState, useRef, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Edit, Save, X, FileDown, Book, BookOpen, GamepadIcon, Lightbulb, HelpCircle, MessageSquare, Trash2, Volume2, VolumeX } from "lucide-react"
import { translateTerm, updateModule, answerQuestion, deleteModule, evaluateQuizAnswer, generateJamaicanVoice } from "@/app/actions"
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
  // Improved logging to better track what's being received
  console.log(`ModulesList received ${initialModules?.length || 0} initial modules`);
  if (initialModules?.length > 0) {
    console.log(`First module title: "${initialModules[0]?.title}"`);
  }
  
  // Check if initialModules is an array
  if (!Array.isArray(initialModules)) {
    console.error("initialModules is not an array, using empty array");
    initialModules = [];
  }
  
  // If the initialModules contains an "Example Module", but we have more than one module,
  // filter out the example module (it's likely a default that snuck in)
  if (initialModules.length > 1) {
    const exampleModuleIndex = initialModules.findIndex(m => m.title === "Example Module");
    if (exampleModuleIndex >= 0) {
      console.log("Filtering out default Example Module since we have real modules");
      initialModules = initialModules.filter((_, i) => i !== exampleModuleIndex);
    }
  }
  
  // Ensure each module has the proper structure
  const safeInitialModules = initialModules.map(module => ensureValidModuleStructure(module));
  console.log(`Processed ${safeInitialModules.length} modules for display with titles: ${safeInitialModules.map(m => m.title).join(', ')}`);
  
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

      await updateModule(editingModule.index, editingModule.content)
      setEditingModule(null)
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

  const handleDownloadPDF = async (index: number) => {
    setIsGeneratingPDF(true)
    try {
      const module = modules[index]
      
      // Create a PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // Add a header
      pdf.setFontSize(22)
      pdf.setTextColor(41, 128, 185) // Blue color
      pdf.text(module.title, 20, 20)
      
      pdf.setFontSize(14)
      pdf.setTextColor(0, 0, 0) // Black color
      pdf.text("Generated by QuantumEd AI", 20, 30)
      pdf.text(module.description, 20, 40)
      
      // Add a line
      pdf.setDrawColor(200, 200, 200)
      pdf.line(20, 45, 190, 45)
      
      let yPosition = 55
      
      // Add Learning Objectives
      if (module.learningObjectives && module.learningObjectives.length > 0) {
        pdf.setFontSize(16)
        pdf.setTextColor(44, 62, 80) // Dark blue
        pdf.text("Learning Objectives", 20, yPosition)
        yPosition += 10
        
        pdf.setFontSize(12)
        pdf.setTextColor(0, 0, 0)
        
        module.learningObjectives.forEach((objective, objIndex) => {
          // Check if we need a new page
          if (yPosition > 270) {
            pdf.addPage()
            yPosition = 20
          }
          
          const bulletPoint = String.fromCharCode(8226)
          const splitObjective = pdf.splitTextToSize(`${bulletPoint} ${objective}`, 170)
          pdf.text(splitObjective, 25, yPosition)
          yPosition += 7 * splitObjective.length
        })
        
        yPosition += 10
        
        // Add a line after objectives
        pdf.setDrawColor(200, 200, 200)
        pdf.line(20, yPosition, 190, yPosition)
        yPosition += 10
      }
      
      // Add topics
      pdf.setFontSize(16)
      pdf.setTextColor(44, 62, 80) // Dark blue
      pdf.text("Topics", 20, yPosition)
      yPosition += 10
      
      module.topics.forEach((topic, topicIndex) => {
        // Topic title
        pdf.setFontSize(14)
        pdf.setTextColor(41, 128, 185) // Blue
        pdf.text(`${topicIndex + 1}. ${topic.title}`, 20, yPosition)
        yPosition += 8
        
        // Content
        pdf.setFontSize(12)
        pdf.setTextColor(0, 0, 0)
        const splitContent = pdf.splitTextToSize(topic.content, 170)
        pdf.text(splitContent, 25, yPosition)
        yPosition += 7 * splitContent.length + 5
        
        // Key Terms (if available)
        if (topic.keyTerms && topic.keyTerms.length > 0) {
          // Check if we need a new page
          if (yPosition > 240) {
            pdf.addPage()
            yPosition = 20
          }
          
          pdf.setFontSize(13)
          pdf.setTextColor(46, 125, 50) // Green color
          pdf.text("Key Terms:", 25, yPosition)
          yPosition += 8
          
          topic.keyTerms.forEach((term, termIndex) => {
            // Check if we need a new page
            if (yPosition > 250) {
              pdf.addPage()
              yPosition = 20
            }
            
            // Term name
            pdf.setFontSize(12)
            pdf.setTextColor(46, 125, 50) // Green
            pdf.text(`• ${term.term}`, 30, yPosition)
            yPosition += 6
            
            // Simplified definition
            pdf.setFontSize(10)
            pdf.setTextColor(0, 0, 0)
            const splitDefinition = pdf.splitTextToSize(`${term.simplifiedDefinition}`, 160)
            pdf.text(splitDefinition, 35, yPosition)
            yPosition += 5 * splitDefinition.length
            
            // Examples (if available)
            if (term.examples && term.examples.length > 0) {
              pdf.setFontSize(10)
              pdf.setTextColor(100, 100, 100) // Gray
              pdf.text("Examples:", 35, yPosition)
              yPosition += 5
              
              term.examples.forEach((example, exampleIndex) => {
                const splitExample = pdf.splitTextToSize(`- ${example}`, 155)
                pdf.text(splitExample, 40, yPosition)
                yPosition += 5 * splitExample.length
              })
              
              yPosition += 3 // Add a little extra space after examples
            }
          })
          
          yPosition += 5 // Add space after key terms
        }
        
        // Subtopics
        pdf.setFontSize(12)
        pdf.setTextColor(0, 0, 0)
        
        // Check if we need a new page
        if (yPosition > 240) {
          pdf.addPage()
          yPosition = 20
        }
        
        pdf.text("Subtopics:", 25, yPosition)
        yPosition += 7
        
        topic.subtopics.forEach((subtopic, stIndex) => {
          // Check if we need a new page
          if (yPosition > 270) {
            pdf.addPage()
            yPosition = 20
          }
          
          const bulletPoint = String.fromCharCode(8226)
          const splitSubtopic = pdf.splitTextToSize(`${bulletPoint} ${subtopic}`, 160)
          pdf.text(splitSubtopic, 30, yPosition)
          yPosition += 7 * splitSubtopic.length
        })
        
        yPosition += 10
        
        // Check if we need a new page
        if (yPosition > 240) {
          pdf.addPage()
          yPosition = 20
        }
      })
      
      // Add a new page for flashcards
      pdf.addPage()
      yPosition = 20
      
      // Flashcards header
      pdf.setFontSize(16)
      pdf.setTextColor(44, 62, 80)
      pdf.text("Flashcards", 20, yPosition)
      yPosition += 10
      
      module.learningTools.flashcards.forEach((flashcard, cardIndex) => {
        // Check if we need a new page
        if (yPosition > 250) {
          pdf.addPage()
          yPosition = 20
        }
        
        // Term
        pdf.setFontSize(14)
        pdf.setTextColor(41, 128, 185)
        pdf.text(`${cardIndex + 1}. ${flashcard.term}`, 20, yPosition)
        yPosition += 8
        
        // Definition
        pdf.setFontSize(12)
        pdf.setTextColor(0, 0, 0)
        const splitDefinition = pdf.splitTextToSize(`Definition: ${flashcard.definition}`, 170)
        pdf.text(splitDefinition, 25, yPosition)
        yPosition += 7 * splitDefinition.length
        
        // Simplified Definition (if available)
        if (flashcard.simplifiedDefinition) {
          pdf.setFontSize(12)
          pdf.setTextColor(46, 125, 50) // Green color for simplified
          const splitSimplified = pdf.splitTextToSize(`Simplified: ${flashcard.simplifiedDefinition}`, 170)
          pdf.text(splitSimplified, 25, yPosition)
          yPosition += 7 * splitSimplified.length
        }
        
        // Creole Translation (if available)
        if (flashcard.creoleDefinition) {
          pdf.setFontSize(12)
          pdf.setTextColor(231, 76, 60) // Red color for Creole
          const splitTranslation = pdf.splitTextToSize(`Jamaican Creole: ${flashcard.creoleDefinition}`, 170)
          pdf.text(splitTranslation, 25, yPosition)
          yPosition += 7 * splitTranslation.length
        }
        
        yPosition += 5
      })
      
      // Save the PDF
      pdf.save(`${module.title.replace(/\s+/g, "_")}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error generating PDF. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
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
      console.error("Cannot start quiz: no questions available");
      return;
    }

    // Log the number of questions to help debug
    console.log(`Starting quiz: ${quiz.title} with ${quiz.questions.length} questions`);
    
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
    if (quizState.currentQuiz === null || !quizState.selectedAnswer) return;
    
    const currentModule = modules[selectedModule || 0];
    const currentQuiz = currentModule.learningTools.games[quizState.currentQuiz];
    const currentQuestion = currentQuiz.questions[quizState.currentQuestion];
    
    // Set evaluating state
    setQuizState({...quizState, isEvaluating: true});
    
    try {
      // Create context information from the module for better AI evaluation
      const moduleContext = `
        Module: ${currentModule.title}
        Description: ${currentModule.description}
        Topics: ${currentModule.topics.map(t => t.title).join(", ")}
      `;
      
      // Use AI to evaluate the answer
      const result = await evaluateQuizAnswer(
        currentQuestion.question,
        currentQuestion.options,
        currentQuestion.correctAnswer,
        quizState.selectedAnswer,
        moduleContext
      );
      
      if (result.success) {
        const { isCorrect, feedback } = result.evaluation;
        
        // Update quiz state with AI evaluation results
        if (isCorrect) {
          setQuizState({
            ...quizState, 
            correctAnswers: quizState.correctAnswers + 1,
            feedback: feedback,
            isEvaluating: false,
            aiEvaluation: JSON.stringify(result.evaluation)
          });
        } else {
          setQuizState({
            ...quizState,
            feedback: feedback,
            isEvaluating: false,
            aiEvaluation: JSON.stringify(result.evaluation)
          });
        }
        
        // Wait for user to review feedback before moving to next question
        // The UI will have a "Continue" button that calls moveToNextQuestion
      } else {
        // Fallback to simple matching if AI evaluation fails
        const simpleIsCorrect = quizState.selectedAnswer === currentQuestion.correctAnswer;
        
        if (simpleIsCorrect) {
          setQuizState({
            ...quizState, 
            correctAnswers: quizState.correctAnswers + 1,
            feedback: "Correct! Well done.",
            isEvaluating: false
          });
        } else {
          setQuizState({
            ...quizState,
            feedback: `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`,
            isEvaluating: false
          });
        }
      }
    } catch (error) {
      console.error("Error checking answer:", error);
      
      // Fallback to simple string matching
      const isCorrect = quizState.selectedAnswer === currentQuestion.correctAnswer;
      
      if (isCorrect) {
        setQuizState({
          ...quizState, 
          correctAnswers: quizState.correctAnswers + 1,
          feedback: "Correct! Well done.",
          isEvaluating: false
        });
      } else {
        setQuizState({
          ...quizState,
          feedback: `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`,
          isEvaluating: false
        });
      }
    }
  }
  
  const moveToNextQuestion = () => {
    const currentModule = modules[selectedModule || 0];
    const currentQuiz = currentModule.learningTools.games[quizState.currentQuiz as number];
    
    if (quizState.currentQuestion < currentQuiz.questions.length - 1) {
      // Move to next question
      setQuizState({
        ...quizState,
        currentQuestion: quizState.currentQuestion + 1,
        selectedAnswer: null,
        feedback: null,
        aiEvaluation: null
      });
    } else {
      // End of quiz, show results
      setQuizState({
        ...quizState,
        showResults: true,
        feedback: null,
        aiEvaluation: null
      });
    }
  }

  const handleNextFlashcard = () => {
    const flashcards = modules[selectedModule || 0].learningTools.flashcards;
    setCurrentFlashcardIndex((prev) => (prev + 1) % flashcards.length);
    setShowFlashcardAnswer(false);
  }
  
  const handlePrevFlashcard = () => {
    const flashcards = modules[selectedModule || 0].learningTools.flashcards;
    setCurrentFlashcardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setShowFlashcardAnswer(false);
  }
  
  const toggleFlashcardAnswer = () => {
    setShowFlashcardAnswer(!showFlashcardAnswer);
  }

  // Submit a question to get an AI-generated answer
  const handleSubmitQuestion = async () => {
    if (!userQuestion.trim() || isGeneratingAnswer) return;
    
    setIsGeneratingAnswer(true);
    setGeneratedAnswer(null);
    
    try {
      // Create context information from the selected module
      const currentModule = modules[selectedModule || 0];
      const moduleContext = `
        Module: ${currentModule.title}
        Description: ${currentModule.description}
        Topics: ${currentModule.topics.map(t => `${t.title}: ${t.content}`).join("\n")}
        Key Terms: ${currentModule.topics.flatMap(t => t.keyTerms || []).map(k => `${k.term}: ${k.simplifiedDefinition}`).join("\n")}
      `;
      
      const result = await answerQuestion(userQuestion, moduleContext);
      if (result.success) {
        setGeneratedAnswer(result.answer || "No answer was generated. Please try again.");
      } else {
        setGeneratedAnswer("Sorry, I couldn't generate an answer. Please try again.");
      }
    } catch (error) {
      console.error("Error generating answer:", error);
      setGeneratedAnswer("An error occurred while generating the answer. Please try again.");
    } finally {
      setIsGeneratingAnswer(false);
    }
  }

  const handleDeleteModule = async (index: number) => {
    if (confirm("Are you sure you want to delete this module? This action cannot be undone.")) {
      try {
        await deleteModule(index);
        const newModules = [...modules];
        newModules.splice(index, 1);
        setModules(newModules);
        
        if (selectedModule === index) {
          setSelectedModule(newModules.length > 0 ? 0 : null);
        } else if (selectedModule !== null && selectedModule > index) {
          setSelectedModule(selectedModule - 1);
        }
      } catch (error) {
        console.error("Error deleting module:", error);
        alert("Failed to delete module. Please try again.");
      }
    }
  }

  const translateKeyTerm = async (term: string, topicIndex: number, keyTermIndex: number) => {
    if (isTranslating) return;
    
    setIsTranslating(true);
    try {
      // Call the server action to translate the term
      const result = await translateTerm(term);
      
      if (result.success && result.translation) {
        // Extract only the Jamaican Creole part from the response
        // The response follows the format:
        // 1. English explanation
        // 2. Jamaican Creole: [translation]
        // 3. Example sentence
        
        const translation = result.translation;
        let jamaicanCreole = "";
        
        // Try to find the Jamaican Creole section specifically
        const lines = translation.split('\n');
        
        // First approach: Look for "2. Jamaican Creole:" pattern
        const creoleLineIndex = lines.findIndex(line => 
          line.trim().match(/^2\.\s*Jamaican\s+Creole:?/i)
        );
        
        if (creoleLineIndex !== -1 && creoleLineIndex + 1 < lines.length) {
          // Get the next line after the header which should contain just the Creole
          let nextLine = lines[creoleLineIndex + 1].trim();
          
          // If the next line is empty, try the one after that
          if (!nextLine && creoleLineIndex + 2 < lines.length) {
            nextLine = lines[creoleLineIndex + 2].trim();
          }
          
          jamaicanCreole = nextLine;
          console.log("Found Jamaican Creole by pattern 1:", jamaicanCreole);
        } else {
          // Second approach: Look for lines with "Jamaican Creole:" in them
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.match(/Jamaican\s+Creole:?/i)) {
              // Check if the Creole is on this line after the colon
              const colonParts = line.split(':');
              if (colonParts.length > 1 && colonParts[1].trim()) {
                jamaicanCreole = colonParts[1].trim();
                console.log("Found Jamaican Creole by pattern 2:", jamaicanCreole);
                break;
              }
              
              // If not, get the next non-empty line
              for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j].trim();
                if (nextLine) {
                  jamaicanCreole = nextLine;
                  console.log("Found Jamaican Creole by pattern 3:", jamaicanCreole);
                  break;
                }
              }
              if (jamaicanCreole) break;
            }
          }
        }
        
        // If we still don't have a Creole translation, try another approach
        if (!jamaicanCreole) {
          // Look for patterns that might indicate Jamaican Patois
          const patoisPatterns = [
            /\bdi\b|\bwi\b|\bdem\b|\bfi\b|\bmi\b|\byu\b|\bim\b|\bno\s+jos\b|\bnuh\b|\bsitn\b|\baaf\b|\bpan\b|\biina\b/i
          ];
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (patoisPatterns.some(pattern => pattern.test(trimmedLine))) {
              jamaicanCreole = trimmedLine;
              console.log("Found Jamaican Creole by language pattern:", jamaicanCreole);
              break;
            }
          }
        }
        
        // Fallback: If we couldn't find the Creole part, use a generic extraction
        if (!jamaicanCreole) {
          // Look for sections that might contain the Creole
          const middleIndex = Math.floor(lines.length / 2);
          for (let i = middleIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.match(/^\d+\./) && !line.match(/example/i)) {
              jamaicanCreole = line;
              console.log("Found Jamaican Creole by fallback:", jamaicanCreole);
              break;
            }
          }
        }
        
        // If we still don't have a result, just take the first non-empty line after the halfway point
        if (!jamaicanCreole) {
          const middleIndex = Math.floor(lines.length / 2);
          for (let i = middleIndex; i < lines.length; i++) {
            if (lines[i].trim()) {
              jamaicanCreole = lines[i].trim();
              console.log("Found Jamaican Creole by last resort:", jamaicanCreole);
              break;
            }
          }
        }
        
        // Create a copy of the modules array to modify it
        const updatedModules = [...modules];
        
        // Add the translation to the specific key term
        if (updatedModules[selectedModule!]?.topics[topicIndex]?.keyTerms?.[keyTermIndex]) {
          updatedModules[selectedModule!].topics[topicIndex].keyTerms![keyTermIndex].translatedDefinition = 
            jamaicanCreole || translation;
          
          // Update the state with the new modules array
          setModules(updatedModules);
          
          // Also update the stored modules
          await updateModule(selectedModule!, JSON.stringify(updatedModules[selectedModule!], null, 2));
        }
      }
    } catch (error) {
      console.error("Error translating term:", error);
    } finally {
      setIsTranslating(false);
    }
  }

  // Function to ensure module has valid structure
  function ensureValidModuleStructure(module: any): Module {
    try {
      // Default structure for a module
      const defaultModule: Module = {
        title: "Default Module",
        description: "A default module with placeholder content.",
        learningObjectives: ["Understand core concepts", "Apply knowledge to practical situations"],
        topics: [
          {
            title: "Getting Started",
            content: "Introduction to the topic.",
            subtopics: ["Basic concepts", "Fundamental principles"],
            keyTerms: []
          }
        ],
        learningTools: {
          games: [
            {
              title: "Basic Quiz",
              questions: [
                {
                  question: "What is the purpose of education?",
                  options: [
                    "To memorize facts",
                    "To develop critical thinking",
                    "To pass tests",
                    "To get certificates"
                  ],
                  correctAnswer: "To develop critical thinking",
                  explanation: "Education is meant to develop critical thinking skills that help solve problems",
                  difficulty: "medium",
                  tags: ["education", "purpose"]
                }
              ]
            }
          ],
          flashcards: [
            {
              term: "Learning",
              definition: "The process of acquiring knowledge"
            }
          ],
          questionBank: [
            {
              question: "How can I improve my learning?",
              answer: "Practice regularly and connect new information to what you already know."
            }
          ]
        }
      };
      
      // Ensure module has required properties
      const safeModule = {
        title: module.title || defaultModule.title,
        description: module.description || defaultModule.description,
        learningObjectives: Array.isArray(module.learningObjectives) 
          ? module.learningObjectives 
          : defaultModule.learningObjectives,
        topics: Array.isArray(module.topics) && module.topics.length > 0
          ? module.topics.map((topic: any) => ({
              title: topic.title || "Topic",
              content: topic.content || "Content for this topic",
              subtopics: Array.isArray(topic.subtopics) ? topic.subtopics : defaultModule.topics[0].subtopics,
              keyTerms: Array.isArray(topic.keyTerms) ? topic.keyTerms.map((term: any) => ({
                term: term.term || "Term",
                simplifiedDefinition: term.simplifiedDefinition || "Simplified definition",
                examples: Array.isArray(term.examples) ? term.examples : [],
                translatedDefinition: term.translatedDefinition || undefined
              })) : []
            }))
          : defaultModule.topics,
        learningTools: {
          games: Array.isArray(module.learningTools?.games) && module.learningTools.games.length > 0
            ? module.learningTools.games.map((game: any) => {
                // Get questions from the game or use an empty array
                const originalQuestions = Array.isArray(game.questions) ? [...game.questions] : [];
                
                // Process existing questions
                const processedQuestions = originalQuestions.map((q: any) => ({
                  question: q.question || "Question",
                  options: Array.isArray(q.options) && q.options.length > 0 
                    ? q.options 
                    : ["Option A", "Option B", "Option C", "Option D"],
                  correctAnswer: q.correctAnswer || q.options?.[0] || "Option A",
                  explanation: q.explanation || "This is the correct answer based on the module content.",
                  difficulty: q.difficulty || "medium",
                  tags: Array.isArray(q.tags) ? q.tags : ["general"]
                }));
                
                // If we have no questions at all, use the default
                if (processedQuestions.length === 0) {
                  return {
                    title: game.title || "Quiz",
                    questions: [...defaultModule.learningTools.games[0].questions]
                  };
                }
                
                // If we have fewer than 10 questions, duplicate existing ones with variations
                // to reach at least 10 questions
                if (processedQuestions.length < 10) {
                  console.log(`Quiz "${game.title}" has only ${processedQuestions.length} questions, adding more to reach 10+`);
                  const originalCount = processedQuestions.length;
                  
                  for (let i = 0; processedQuestions.length < 10; i++) {
                    // Cycle through original questions
                    const sourceIdx = i % originalCount;
                    const sourceQuestion = processedQuestions[sourceIdx];
                    
                    // Create a slightly modified version to avoid exact duplicates
                    processedQuestions.push({
                      ...sourceQuestion,
                      question: `${sourceQuestion.question} (variation ${Math.floor(i / originalCount) + 1})`,
                    });
                  }
                }
                
                return {
                  title: game.title || "Quiz",
                  questions: processedQuestions
                };
              })
            : [...defaultModule.learningTools.games],
          flashcards: Array.isArray(module.learningTools?.flashcards) && module.learningTools.flashcards.length > 0
            ? module.learningTools.flashcards.map((card: any) => ({
                term: card.term || "Term",
                definition: card.definition || "Definition",
                simplifiedDefinition: card.simplifiedDefinition || undefined,
                creoleDefinition: card.creoleDefinition || undefined
              }))
            : [...defaultModule.learningTools.flashcards],
          questionBank: Array.isArray(module.learningTools?.questionBank) && module.learningTools.questionBank.length > 0
            ? module.learningTools.questionBank.map((qa: any) => ({
                question: qa.question || "Question",
                answer: qa.answer || "Answer"
              }))
            : [...defaultModule.learningTools.questionBank]
        }
      };

      console.log(`Module "${safeModule.title}" processed successfully`);
      return safeModule;
    } catch (error) {
      console.error("Error ensuring valid module structure:", error);
      // Create a new default module rather than referencing a potentially
      // out-of-scope variable
      return {
        title: "Fallback Module",
        description: "A fallback module with basic content.",
        learningObjectives: ["Understand core concepts", "Apply knowledge to practical situations"],
        topics: [
          {
            title: "Getting Started",
            content: "Introduction to the topic.",
            subtopics: ["Basic concepts", "Fundamental principles"],
            keyTerms: []
          }
        ],
        learningTools: {
          games: [
            {
              title: "Basic Quiz",
              questions: [
                {
                  question: "What is the purpose of education?",
                  options: [
                    "To memorize facts",
                    "To develop critical thinking",
                    "To pass tests",
                    "To get certificates"
                  ],
                  correctAnswer: "To develop critical thinking",
                  explanation: "Education is meant to develop critical thinking skills that help solve problems",
                  difficulty: "medium",
                  tags: ["education", "purpose"]
                }
              ]
            }
          ],
          flashcards: [
            {
              term: "Learning",
              definition: "The process of acquiring knowledge"
            }
          ],
          questionBank: [
            {
              question: "How can I improve my learning?",
              answer: "Practice regularly and connect new information to what you already know."
            }
          ]
        }
      };
    }
  }

  // Text to speech function
  const speakText = (text: string | undefined | null) => {
    try {
      // Handle undefined or null text
      if (!text) {
        console.warn("Attempted to speak empty text");
        return;
      }

      // Cancel any ongoing speech
      if (isSpeaking) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
        return
      }

      // Create a new utterance if none exists
      if (!speechSynthesisRef.current) {
        speechSynthesisRef.current = new SpeechSynthesisUtterance()
      }

      // Configure the utterance
      const utterance = speechSynthesisRef.current
      utterance.text = text
      utterance.rate = 0.9 // Slightly slower for better comprehension
      utterance.pitch = 1.0
      
      // Handle voice selection safely
      const setVoice = () => {
        try {
          const voices = window.speechSynthesis.getVoices()
          if (voices.length > 0) {
            // Try to find an English female voice
            const englishVoice = voices.find(voice => 
              voice.lang.includes('en') && voice.name.includes('Female')
            ) || voices.find(voice => 
              voice.lang.includes('en')
            ) || voices[0]  // Fallback to first available voice
            
            utterance.voice = englishVoice
          }
        } catch (e) {
          console.error("Error setting voice:", e)
        }
      }
      
      // Try to set voice immediately
      setVoice()
      
      // Set up event handlers
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      // Speak the text
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error("Error with text-to-speech:", error)
      setIsSpeaking(false)
    }
  }

  // Helper function to safely play audio
  const safelyPlayAudio = (audio: HTMLAudioElement) => {
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
            setIsSpeaking(false);
          } else {
            console.error('Error during audio playback:', error);
            setIsSpeaking(false);
            // Fall back to regular speech synthesis if there's another error
            if (audio.src) {
              speakText(currentPlayText.current || '');
            }
          }
        });
      }
    } catch (error) {
      console.error('Error during audio playback setup:', error);
      setIsSpeaking(false);
    }
  };

  // Keep track of current text being played
  const currentPlayText = useRef<string | null>(null);

  const playJamaicanVoice = async (text: string | undefined | null, isCreole: boolean = false) => {
    // Early return if no text or already speaking
    if (!text || isSpeaking || !audioRef.current) {
      return;
    }
    
    currentPlayText.current = text;
    setIsSpeaking(true);
    
    try {
      // Stop any currently playing audio
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      if (audioRef.current.src) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          useJamaicanVoice: true, // Always use Jamaican voice for this function
          voiceType: isCreole ? 'student' : 'teacher' // Use student voice for Creole text, otherwise teacher
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.audioData) {
        // Set up audio
        const audio = audioRef.current;
        audio.src = result.audioData;
        
        // Set up event handlers
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
          console.error("Error playing audio");
          setIsSpeaking(false);
          // Fall back to regular speech synthesis
          speakText(text);
        };
        
        // Play the audio using safe method
        safelyPlayAudio(audio);
      } else {
        // Check if we should use browser TTS
        if (result.shouldUseBrowserTTS) {
          console.log("API key not configured or error - falling back to browser TTS");
          speakText(text);
        } else {
          console.error("Failed to generate voice:", result.error);
          speakText(text);
        }
      }
    } catch (error) {
      console.error("Error generating Jamaican voice:", error);
      setIsSpeaking(false);
      speakText(text); // Fall back to regular TTS
    }
  };

  // Stop speaking when component unmounts
  const stopSpeaking = () => {
    if (isSpeaking) {
      try {
        window.speechSynthesis.cancel()
      } catch (error) {
        console.error("Error stopping speech:", error)
      }
      setIsSpeaking(false)
    }
  }
  
  // Add useEffect to handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  if (editingModule !== null) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Editing Module</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </div>
        </div>

        <textarea
          className="w-full h-96 p-4 font-mono text-sm bg-muted border rounded-md"
          value={editingModule.content}
          onChange={(e) => setEditingModule({ ...editingModule, content: e.target.value })}
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6">
      {/* Module selector sidebar */}
      <div className="md:col-span-1 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Modules</h2>
        {modules.map((module, i) => (
          <Card 
            key={i} 
            className={`cursor-pointer transition-all hover:shadow ${selectedModule === i ? 'border-primary' : ''}`}
            onClick={() => handleSelectModule(i)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-medium truncate">{module.title}</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="ml-2 h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteModule(i);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{module.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content */}
      <div className="md:col-span-3">
        {selectedModule !== null && modules[selectedModule] && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold">{modules[selectedModule].title}</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => speakText(modules[selectedModule].title + ". " + modules[selectedModule].description)}
                >
                  {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  <span className="sr-only">{isSpeaking ? "Stop reading" : "Read aloud"}</span>
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(selectedModule)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownload(modules[selectedModule])}>
                  <Download className="h-4 w-4 mr-1" /> Export JSON
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(selectedModule)} disabled={isGeneratingPDF}>
                  <FileDown className="h-4 w-4 mr-1" />
                  {isGeneratingPDF ? "Generating..." : "Export PDF"}
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/conversations?module=${selectedModule}`}>
                    <MessageSquare className="h-4 w-4 mr-1" /> Discuss
                  </Link>
                </Button>
              </div>
            </div>

            <p className="text-muted-foreground">{modules[selectedModule].description}</p>

            {/* Learning Objectives Section */}
            {modules[selectedModule].learningObjectives && modules[selectedModule].learningObjectives.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold text-primary-100 mb-2">Learning Objectives</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2 mb-2"
                    onClick={() => speakText("Learning Objectives. " + modules[selectedModule].learningObjectives?.join(". "))}
                  >
                    {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    <span className="sr-only">{isSpeaking ? "Stop reading" : "Read objectives aloud"}</span>
                  </Button>
                </div>
                <div className="bg-bg-200/20 p-4 rounded-md">
                  <ul className="list-disc pl-5 space-y-1">
                    {modules[selectedModule].learningObjectives.map((objective, index) => (
                      <li key={index} className="text-text-100">{objective}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Learning tools tabs */}
            <Tabs value={selectedLearningTool} onValueChange={handleSelectLearningTool} className="mt-6">
              <TabsList>
                <TabsTrigger value="modules">
                  <Book className="h-4 w-4 mr-2" /> Topics
                </TabsTrigger>
                <TabsTrigger value="games">
                  <GamepadIcon className="h-4 w-4 mr-2" /> Games
                </TabsTrigger>
                <TabsTrigger value="flashcards">
                  <Lightbulb className="h-4 w-4 mr-2" /> Flashcards
                </TabsTrigger>
                <TabsTrigger value="qa">
                  <MessageSquare className="h-4 w-4 mr-2" /> Ask Questions
                </TabsTrigger>
              </TabsList>

              {/* Module/Topics content */}
              <TabsContent value="modules" className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">{modules[selectedModule].title}</h3>
                  <ModuleVoiceConversation 
                    module={modules[selectedModule]} 
                    moduleIndex={selectedModule} 
                  />
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {modules[selectedModule].topics.map((topic, topicIndex) => (
                    <AccordionItem key={topicIndex} value={`topic-${topicIndex}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center">
                          <span className="font-medium">{topic.title}</span>
                          <div 
                            className="ml-2 p-1 hover:bg-accent rounded-full cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent accordion from toggling
                              speakText(topic.title);
                            }}
                          >
                            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            <span className="sr-only">{isSpeaking ? "Stop reading" : "Read title"}</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="p-4 space-y-4">
                          <div className="flex items-start">
                            <p className="flex-1">{topic.content}</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="ml-2 flex-shrink-0"
                              onClick={() => speakText(topic.content)}
                            >
                              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                              <span className="sr-only">{isSpeaking ? "Stop reading" : "Read content"}</span>
                            </Button>
                          </div>
                          
                          {topic.keyTerms && topic.keyTerms.length > 0 && (
                            <div className="mt-6">
                              <h4 className="font-medium mb-2">Key Terms (Simplified for Learning):</h4>
                              <div className="space-y-4">
                                {topic.keyTerms.map((keyTerm, ktIndex) => (
                                  <div key={ktIndex} className="bg-accent/40 p-4 rounded-md">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center">
                                        <h5 className="font-semibold text-primary">{keyTerm.term}</h5>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="ml-2"
                                          onClick={() => speakText(keyTerm.term + ". " + keyTerm.simplifiedDefinition)}
                                        >
                                          {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                          <span className="sr-only">{isSpeaking ? "Stop reading" : "Read term"}</span>
                                        </Button>
                                      </div>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-xs"
                                        onClick={() => translateKeyTerm(keyTerm.term, topicIndex, ktIndex)}
                                        disabled={isTranslating}
                                      >
                                        {isTranslating ? (
                                          <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Translating...
                                          </>
                                        ) : (
                                          'Translate to Creole'
                                        )}
                                      </Button>
                                    </div>
                                    <p className="mt-1">{keyTerm.simplifiedDefinition}</p>
                                    {keyTerm.translatedDefinition && (
                                      <div className="mt-2 bg-primary/10 p-2 rounded-md">
                                        <div className="flex items-center">
                                          <h6 className="text-sm font-medium text-primary">Jamaican Creole:</h6>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="ml-2"
                                            disabled={isGeneratingJamaicanVoice}
                                            onClick={() => playJamaicanVoice(keyTerm.translatedDefinition || "", true)}
                                          >
                                            {isGeneratingJamaicanVoice ? (
                                              <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                              </svg>
                                            ) : isSpeaking ? (
                                              <VolumeX className="h-4 w-4" />
                                            ) : (
                                              <Volume2 className="h-4 w-4" />
                                            )}
                                            <span className="sr-only">
                                              {isGeneratingJamaicanVoice 
                                                ? "Generating Jamaican voice..." 
                                                : isSpeaking 
                                                  ? "Stop reading" 
                                                  : "Read in Jamaican voice"}
                                            </span>
                                          </Button>
                                        </div>
                                        <p className="text-sm mt-1 italic">{keyTerm.translatedDefinition}</p>
                                      </div>
                                    )}
                                    {keyTerm.examples && keyTerm.examples.length > 0 && (
                                      <div className="mt-2">
                                        <div className="flex items-center">
                                          <h6 className="text-sm font-medium text-muted-foreground">Examples:</h6>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="ml-2"
                                            onClick={() => playJamaicanVoice(keyTerm.examples?.join(". "), false)}
                                          >
                                            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                            <span className="sr-only">{isSpeaking ? "Stop reading" : "Read examples"}</span>
                                          </Button>
                                        </div>
                                        <ul className="list-disc ml-5 text-sm">
                                          {keyTerm.examples.map((example, exIndex) => (
                                            <li key={exIndex}>{example}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <h4 className="font-medium mt-4">Subtopics:</h4>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="ml-2 mt-4"
                              onClick={() => speakText("Subtopics: " + topic.subtopics.join(". "))}
                            >
                              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                              <span className="sr-only">{isSpeaking ? "Stop reading" : "Read subtopics"}</span>
                            </Button>
                          </div>
                          <ul className="ml-6 list-disc space-y-1">
                            {topic.subtopics.map((subtopic, stIndex) => (
                              <li key={stIndex}>{subtopic}</li>
                            ))}
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              {/* Games/Quizzes content */}
              <TabsContent value="games" className="mt-4">
                {quizState.currentQuiz === null ? (
                  <div className="space-y-4">
                    <Card className="shadow-md">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold">Available Quizzes</CardTitle>
                        <CardDescription>
                          Test your knowledge with these interactive quizzes
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {modules[selectedModule].learningTools.games.map((quiz, quizIndex) => (
                            <Card key={quizIndex} className="cursor-pointer hover:bg-accent transition-colors duration-200 shadow-sm" onClick={() => startQuiz(quizIndex)}>
                              <CardContent className="p-4">
                                <GamepadIcon className="h-8 w-8 text-primary mb-2" />
                                <h3 className="font-medium">{quiz.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {quiz.questions.length} questions
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="shadow-md">
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold">
                          {modules[selectedModule].learningTools.games[quizState.currentQuiz].title}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={resetQuiz} className="hover:bg-red-100 hover:text-red-700">
                          <X className="h-4 w-4 mr-1" /> Exit Quiz
                        </Button>
                      </div>
                      <CardDescription>
                        {!quizState.showResults 
                          ? `Question ${quizState.currentQuestion + 1} of ${modules[selectedModule].learningTools.games[quizState.currentQuiz].questions.length}`
                          : "Quiz Complete!"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {!quizState.showResults ? (
                        <div className="space-y-6">
                          <div className="text-lg font-medium mb-4 bg-accent/30 p-4 rounded-md">
                            {modules[selectedModule].learningTools.games[quizState.currentQuiz].questions[quizState.currentQuestion].question}
                          </div>
                          <div className="space-y-3">
                            {modules[selectedModule].learningTools.games[quizState.currentQuiz].questions[quizState.currentQuestion].options.map((option, optionIndex) => (
                              <div 
                                key={optionIndex}
                                className={`p-4 border rounded-md cursor-pointer transition-colors ${
                                  quizState.selectedAnswer === option 
                                    ? 'bg-primary/20 border-primary font-medium' 
                                    : 'hover:bg-accent hover:border-accent/50'
                                }`}
                                onClick={() => handleAnswerSelect(option)}
                              >
                                <span className="inline-block w-6 h-6 rounded-full bg-primary/10 text-primary text-center mr-2">
                                  {String.fromCharCode(65 + optionIndex)}
                                </span>
                                {option}
                              </div>
                            ))}
                          </div>
                          
                          {quizState.feedback ? (
                            <div className="mt-6 space-y-4">
                              <div className={`p-5 rounded-md ${
                                JSON.parse(quizState.aiEvaluation || '{"isCorrect": false}').isCorrect 
                                  ? 'bg-primary/10 border border-primary/20' 
                                  : 'bg-accent border border-accent/30'
                              }`}>
                                <h3 className="font-semibold mb-3 text-lg flex items-center">
                                  {JSON.parse(quizState.aiEvaluation || '{"isCorrect": false}').isCorrect 
                                    ? <span className="text-primary flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Correct!</span> 
                                    : <span className="text-primary flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>Feedback</span>
                                  }
                                </h3>
                                <div className="text-sm space-y-2 text-foreground">
                                  <p className="leading-relaxed">{
                                    // Remove any JSON or error-related text from feedback
                                    quizState.feedback?.replace(/(\{|\}|"|\[|\]|error:|Error:).*?(?=\s|$)/g, '').trim()
                                  }</p>
                                  
                                  {quizState.aiEvaluation && (
                                    <div className="mt-4 p-3 bg-background rounded border-t border-border">
                                      <p className="text-sm leading-relaxed">
                                        <span className="font-medium text-primary">Study tip: </span>
                                        {(() => {
                                          try {
                                            const improvement = JSON.parse(quizState.aiEvaluation).improvement;
                                            // Clean up any error or json syntax from the improvement text
                                            return improvement?.replace(/(\{|\}|"|\[|\]|error:|Error:).*?(?=\s|$)/g, '').trim();
                                          } catch (e) {
                                            return "Focus on understanding the core concepts before moving on.";
                                          }
                                        })()}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <Button 
                                className="w-full font-medium" 
                                onClick={moveToNextQuestion}
                              >
                                {quizState.currentQuestion < modules[selectedModule].learningTools.games[quizState.currentQuiz].questions.length - 1 
                                  ? "Next Question" 
                                  : "Finish Quiz"}
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              className="w-full mt-6" 
                              disabled={!quizState.selectedAnswer || quizState.isEvaluating}
                              onClick={checkAnswer}
                            >
                              {quizState.isEvaluating ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Checking Answer...
                                </>
                              ) : (
                                "Check Answer"
                              )}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-6 py-4">
                          <div className="text-center">
                            <div className="inline-flex items-center justify-center p-6 mb-4 rounded-full bg-primary/10">
                              <div className="text-5xl font-bold text-primary">
                                {quizState.correctAnswers} / {modules[selectedModule].learningTools.games[quizState.currentQuiz].questions.length}
                              </div>
                            </div>
                            
                            <p className="text-xl mb-6 font-medium">
                              {quizState.correctAnswers === modules[selectedModule].learningTools.games[quizState.currentQuiz].questions.length 
                                ? "Perfect score! Great job!" 
                                : quizState.correctAnswers > modules[selectedModule].learningTools.games[quizState.currentQuiz].questions.length / 2 
                                  ? "Good job! Keep practicing to improve." 
                                  : "Keep studying and try again!"}
                            </p>
                          </div>
                          
                          <div className="border rounded-md p-5 text-left mb-6 bg-white shadow-sm">
                            <h3 className="font-semibold text-lg mb-4 border-b pb-2">Performance Summary</h3>
                            <div className="space-y-3">
                              <div className="flex items-center">
                                <div className="w-24 font-medium">Accuracy:</div>
                                <div className="flex-1">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${Math.round((quizState.correctAnswers / modules[selectedModule].learningTools.games[quizState.currentQuiz].questions.length) * 100)}%` }}></div>
                                  </div>
                                  <span className="text-sm ml-1">{Math.round((quizState.correctAnswers / modules[selectedModule].learningTools.games[quizState.currentQuiz].questions.length) * 100)}%</span>
                                </div>
                              </div>
                              <p className="text-sm mt-3">
                                <span className="font-medium">Areas to Focus On: </span>
                                {quizState.correctAnswers === modules[selectedModule].learningTools.games[quizState.currentQuiz].questions.length 
                                  ? "You've mastered this quiz! Try another one or review to maintain your knowledge." 
                                  : "Review the questions you missed and their explanations."}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex justify-center space-x-3">
                            <Button 
                              onClick={resetQuiz} 
                              className="px-6"
                            >
                              Exit Quiz
                            </Button>
                            
                            <Button 
                              onClick={() => startQuiz(quizState.currentQuiz as number)} 
                              variant="outline"
                              className="px-6"
                            >
                              Try Again
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Flashcards content - update to include dictation */}
              <TabsContent value="flashcards" className="mt-4">
                <Card className="shadow-md">
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold">Flashcards</CardTitle>
                        <CardDescription>
                          Review key terms and definitions using these interactive flashcards
                        </CardDescription>
                      </div>
                      <div className="bg-primary/10 px-3 py-1 rounded-full text-sm font-medium">
                        {modules[selectedModule].learningTools.flashcards.length} cards
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {modules[selectedModule].learningTools.flashcards.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <span className="text-sm font-medium bg-primary/10 px-3 py-1 rounded-full">
                              {currentFlashcardIndex + 1} of {modules[selectedModule].learningTools.flashcards.length}
                            </span>
                          </div>
                          <div className="space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCurrentFlashcardIndex(
                                  (currentFlashcardIndex - 1 + modules[selectedModule].learningTools.flashcards.length) %
                                    modules[selectedModule].learningTools.flashcards.length
                                )
                                setShowFlashcardAnswer(false)
                              }}
                              disabled={modules[selectedModule].learningTools.flashcards.length <= 1}
                            >
                              Previous
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCurrentFlashcardIndex(
                                  (currentFlashcardIndex + 1) % modules[selectedModule].learningTools.flashcards.length
                                )
                                setShowFlashcardAnswer(false)
                              }}
                              disabled={modules[selectedModule].learningTools.flashcards.length <= 1}
                            >
                              Next
                            </Button>
                          </div>
                        </div>

                        <div className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold mb-2 text-primary">
                              {modules[selectedModule].learningTools.flashcards[currentFlashcardIndex].term}
                            </h3>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              disabled={isGeneratingJamaicanVoice} 
                              onClick={() => playJamaicanVoice(
                                modules[selectedModule].learningTools.flashcards[currentFlashcardIndex].term, 
                                modules[selectedModule].learningTools.flashcards[currentFlashcardIndex].creoleDefinition !== undefined
                              )}
                            >
                              {isGeneratingJamaicanVoice ? (
                                <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : isSpeaking ? (
                                <VolumeX className="h-4 w-4" />
                              ) : (
                                <Volume2 className="h-4 w-4" />
                              )}
                              <span className="sr-only">{isSpeaking ? "Stop reading" : "Read term"}</span>
                            </Button>
                          </div>

                          <div className="mt-4">
                            {!showFlashcardAnswer ? (
                              <div className="flex justify-center">
                                <Button
                                  className="min-w-[150px]"
                                  onClick={() => setShowFlashcardAnswer(true)}
                                >
                                  Show Answer
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="pb-2 border-b">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-primary">Definition:</h4>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => playJamaicanVoice(
                                        modules[selectedModule].learningTools.flashcards[currentFlashcardIndex].definition, 
                                        modules[selectedModule].learningTools.flashcards[currentFlashcardIndex].creoleDefinition !== undefined
                                      )}
                                    >
                                      {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                      <span className="sr-only">{isSpeaking ? "Stop reading" : "Read definition"}</span>
                                    </Button>
                                  </div>
                                  <p className="mt-1">
                                    {modules[selectedModule].learningTools.flashcards[currentFlashcardIndex].definition}
                                  </p>
                                </div>

                                {modules[selectedModule].learningTools.flashcards[currentFlashcardIndex]
                                  .simplifiedDefinition && (
                                  <div className="pb-2 border-b">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium text-green-600">Simplified:</h4>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => playJamaicanVoice(
                                          modules[selectedModule].learningTools.flashcards[currentFlashcardIndex].simplifiedDefinition || "", 
                                          modules[selectedModule].learningTools.flashcards[currentFlashcardIndex].creoleDefinition !== undefined
                                        )}
                                      >
                                        {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                        <span className="sr-only">{isSpeaking ? "Stop reading" : "Read simplified"}</span>
                                      </Button>
                                    </div>
                                    <p className="mt-1">
                                      {
                                        modules[selectedModule].learningTools.flashcards[currentFlashcardIndex]
                                          .simplifiedDefinition
                                      }
                                    </p>
                                  </div>
                                )}

                                {modules[selectedModule].learningTools.flashcards[currentFlashcardIndex]
                                  .creoleDefinition && (
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium text-primary-600">Jamaican Creole:</h4>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        disabled={isGeneratingJamaicanVoice}
                                        onClick={() => playJamaicanVoice(
                                          modules[selectedModule].learningTools.flashcards[currentFlashcardIndex].creoleDefinition || "", true
                                        )}
                                      >
                                        {isGeneratingJamaicanVoice ? (
                                          <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                        ) : isSpeaking ? (
                                          <VolumeX className="h-4 w-4" />
                                        ) : (
                                          <Volume2 className="h-4 w-4" />
                                        )}
                                        <span className="sr-only">
                                          {isGeneratingJamaicanVoice 
                                            ? "Generating Jamaican voice..." 
                                            : isSpeaking 
                                              ? "Stop reading" 
                                              : "Read in Jamaican voice"}
                                        </span>
                                      </Button>
                                    </div>
                                    <p className="mt-1 italic">
                                      {modules[selectedModule].learningTools.flashcards[currentFlashcardIndex].creoleDefinition}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-center mt-4">
                          <Button variant="outline" size="sm" onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}>
                            {showFlashcardAnswer ? "Hide Answer" : "Show Answer"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">No flashcards available for this module.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Q&A content - update to include dictation */}
              <TabsContent value="qa" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Ask a Question</CardTitle>
                    <CardDescription>
                      Ask questions about this topic to get personalized answers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <textarea
                            className="flex-1 min-h-[60px] rounded-md border bg-background p-2"
                            placeholder="Ask a question about the material..."
                            value={userQuestion}
                            onChange={(e) => setUserQuestion(e.target.value)}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="self-start"
                            onClick={() => playJamaicanVoice(userQuestion, false)}
                          >
                            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            <span className="sr-only">{isSpeaking ? "Stop reading" : "Read question"}</span>
                          </Button>
                        </div>
                        <Button
                          onClick={handleSubmitQuestion}
                          disabled={isGeneratingAnswer || !userQuestion.trim()}
                          className="self-start"
                        >
                          {isGeneratingAnswer ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating Answer...
                            </>
                          ) : (
                            'Submit Question'
                          )}
                        </Button>
                      </div>

                      {generatedAnswer && (
                        <div className="mt-4 p-4 bg-accent/20 rounded-md">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium mb-2">Answer:</h3>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => playJamaicanVoice(generatedAnswer, false)}
                            >
                              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                              <span className="sr-only">{isSpeaking ? "Stop reading" : "Read answer"}</span>
                            </Button>
                          </div>
                          <p className="whitespace-pre-line">{generatedAnswer}</p>
                        </div>
                      )}

                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-2">
                          <div className="flex items-center">
                            <span>Common Questions</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="ml-2"
                              onClick={() => playJamaicanVoice("Common Questions: " + modules[selectedModule].learningTools.questionBank.map(q => q.question).join(". "), false)}
                            >
                              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                              <span className="sr-only">{isSpeaking ? "Stop reading" : "Read questions"}</span>
                            </Button>
                          </div>
                        </h3>
                        <div className="space-y-3">
                          {modules[selectedModule].learningTools.questionBank.map((qaItem, qaIndex) => (
                            <div key={qaIndex} className="border rounded-md p-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{qaItem.question}</h4>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => playJamaicanVoice(qaItem.question + ". " + qaItem.answer, false)}
                                >
                                  {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                  <span className="sr-only">{isSpeaking ? "Stop reading" : "Read Q&A"}</span>
                                </Button>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">{qaItem.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}

