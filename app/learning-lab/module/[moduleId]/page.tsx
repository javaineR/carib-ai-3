"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Code, Atom, Book, ListChecks, BookOpen, MessageCircle, Lightbulb } from "lucide-react";
import Link from "next/link";

// Define interfaces for module content
interface Lesson {
  title: string;
  content: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface ModuleContent {
  overview: string;
  lessons: Lesson[];
  quiz: QuizQuestion[];
}

interface Module {
  title: string;
  description: string;
  level: string;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple';
  content: ModuleContent;
}

// Define type for all modules
type ModulesData = {
  [key: string]: Module;
};

const aiModuleData: ModulesData = {
  "ai-basics": {
    title: "AI Fundamentals",
    description: "Learn the basics of artificial intelligence, including key concepts and terminology.",
    level: "Beginner",
    icon: Brain,
    color: "blue",
    content: {
      overview: `
        <h2>Introduction to AI</h2>
        <p>Artificial Intelligence (AI) refers to systems or machines that mimic human intelligence to perform tasks and can iteratively improve themselves based on the information they collect. AI manifests in a variety of forms including:</p>
        <ul>
          <li>Chatbots and virtual assistants like Siri or Alexa</li>
          <li>Recommendation systems on streaming platforms and online stores</li>
          <li>Autonomous vehicles and smart home devices</li>
          <li>Facial recognition and image processing software</li>
        </ul>
        
        <h2>Key Concepts</h2>
        <p>Understanding AI begins with grasping these fundamental concepts:</p>
        <ul>
          <li><strong>Machine Learning:</strong> A subset of AI focused on building systems that learn from data</li>
          <li><strong>Neural Networks:</strong> Computing systems inspired by the human brain's biological neural networks</li>
          <li><strong>Deep Learning:</strong> Advanced neural networks with multiple layers that can learn hierarchical features</li>
          <li><strong>Natural Language Processing:</strong> The ability of machines to understand and respond to human language</li>
        </ul>
      `,
      lessons: [
        {
          title: "What is Artificial Intelligence?",
          content: "AI is the simulation of human intelligence processes by machines, especially computer systems. These processes include learning, reasoning, and self-correction."
        },
        {
          title: "Machine Learning Basics",
          content: "Machine Learning is a subset of AI that provides systems the ability to automatically learn and improve from experience without being explicitly programmed."
        },
        {
          title: "Neural Networks",
          content: "Neural networks are computing systems inspired by the biological neural networks that constitute animal brains. They are designed to recognize patterns and interpret data through a form of machine perception."
        },
        {
          title: "AI Ethics",
          content: "AI ethics deals with the moral principles and guidelines that govern the development and use of artificial intelligence technologies."
        }
      ],
      quiz: [
        {
          question: "What is the main goal of artificial intelligence?",
          options: [
            "To replace human workers",
            "To simulate human intelligence in machines",
            "To create robots that look like humans",
            "To make computers faster"
          ],
          correctAnswer: 1
        },
        {
          question: "Which of the following is NOT a type of machine learning?",
          options: [
            "Supervised learning",
            "Unsupervised learning",
            "Reinforcement learning",
            "Mechanical learning"
          ],
          correctAnswer: 3
        },
        {
          question: "What are neural networks inspired by?",
          options: [
            "Computer circuitry",
            "Human brain structure",
            "Natural weather patterns",
            "Quantum physics"
          ],
          correctAnswer: 1
        },
        {
          question: "Which of the following is an ethical concern in AI development?",
          options: [
            "Making AI systems too user-friendly",
            "Creating AI that requires too much computing power",
            "AI systems that perpetuate bias and discrimination",
            "AI becoming too expensive for companies to implement"
          ],
          correctAnswer: 2
        }
      ]
    }
  },
  "prompt-engineering": {
    title: "Prompt Engineering",
    description: "Master the art of crafting effective prompts for large language models.",
    level: "Intermediate",
    icon: Brain,
    color: "blue",
    content: {
      overview: `
        <h2>Introduction to Prompt Engineering</h2>
        <p>Prompt engineering is the process of designing inputs for large language models (LLMs) to elicit desired responses. It's a crucial skill for effectively utilizing AI tools like ChatGPT, Claude, or other text generation systems.</p>
        
        <h2>Key Concepts</h2>
        <p>Effective prompt engineering involves understanding:</p>
        <ul>
          <li><strong>Context Setting:</strong> Providing clear background information</li>
          <li><strong>Task Specification:</strong> Clearly defining what you want the AI to do</li>
          <li><strong>Format Instructions:</strong> Specifying the desired output format</li>
          <li><strong>Few-shot Learning:</strong> Providing examples to guide the AI response</li>
          <li><strong>Chain of Thought:</strong> Breaking complex reasoning into steps</li>
        </ul>
      `,
      lessons: [
        {
          title: "Prompt Structure",
          content: "Learn how to structure prompts with clear instructions, context, and constraints to get predictable results from AI models."
        },
        {
          title: "Few-shot Learning",
          content: "Discover how to provide examples within your prompts to guide the AI toward producing responses in your desired format or style."
        },
        {
          title: "Chain of Thought",
          content: "Master techniques to guide AI through complex reasoning tasks by breaking down problems into step-by-step thinking processes."
        },
        {
          title: "Parameter Optimization",
          content: "Understand how to adjust parameters like temperature and top-p to control the creativity and focus of AI responses."
        }
      ],
      quiz: [
        {
          question: "What is the primary purpose of prompt engineering?",
          options: [
            "To make AI systems run faster",
            "To design inputs that elicit desired outputs from language models",
            "To create new programming languages for AI",
            "To reduce computing costs of running AI"
          ],
          correctAnswer: 1
        },
        {
          question: "What is 'few-shot learning' in prompt engineering?",
          options: [
            "Training an AI with very little data",
            "Providing examples within prompts to guide AI responses",
            "Using multiple AI models at once",
            "Limiting the AI's response length"
          ],
          correctAnswer: 1
        },
        {
          question: "What does the 'temperature' parameter control in AI text generation?",
          options: [
            "The processing speed of the AI",
            "The randomness/creativity of the output",
            "The hardware temperature of the server",
            "The emotional tone of the response"
          ],
          correctAnswer: 1
        },
        {
          question: "What is 'chain of thought' prompting?",
          options: [
            "Connecting multiple AI systems together",
            "Creating a series of prompts that build on each other",
            "Guiding AI through step-by-step reasoning processes",
            "Using keyword chains to control AI focus"
          ],
          correctAnswer: 2
        }
      ]
    }
  },
  // Add other AI modules here
};

const programmingModuleData: ModulesData = {
  "python-basics": {
    title: "Python Basics",
    description: "Start your programming journey with Python, one of the most beginner-friendly languages.",
    level: "Beginner",
    icon: Code,
    color: "green",
    content: {
      overview: `
        <h2>Introduction to Python</h2>
        <p>Python is a high-level, interpreted programming language known for its readability and simplicity. Created by Guido van Rossum and first released in 1991, Python has become one of the most popular programming languages in the world.</p>
        
        <h2>Key Features</h2>
        <ul>
          <li><strong>Easy to Learn:</strong> Simple, readable syntax designed for beginners</li>
          <li><strong>Versatile:</strong> Used in web development, data science, AI, automation, and more</li>
          <li><strong>Interpreted:</strong> Code is executed line by line, making debugging easier</li>
          <li><strong>Large Standard Library:</strong> Rich set of modules and packages included</li>
          <li><strong>Strong Community:</strong> Extensive documentation and support</li>
        </ul>
      `,
      lessons: [
        {
          title: "Variables & Data Types",
          content: "Learn how to create variables and understand different data types like strings, integers, floating-point numbers, and booleans."
        },
        {
          title: "Control Flow",
          content: "Master conditional statements (if, elif, else) and loops (for, while) to control the flow of your program."
        },
        {
          title: "Functions",
          content: "Discover how to define and use functions to organize your code and make it reusable."
        },
        {
          title: "Basic Data Structures",
          content: "Explore lists, tuples, dictionaries, and sets to store and manipulate collections of data."
        }
      ],
      quiz: [
        {
          question: "What symbol is used for comments in Python?",
          options: ["//", "/*", "#", "<!--"],
          correctAnswer: 2
        },
        {
          question: "Which of these data types is mutable in Python?",
          options: ["Strings", "Tuples", "Lists", "Integers"],
          correctAnswer: 2
        },
        {
          question: "How do you create a function in Python?",
          options: [
            "function myFunction():",
            "def myFunction():",
            "create myFunction():",
            "new function myFunction():"
          ],
          correctAnswer: 1
        },
        {
          question: "What will the following code output? print(3 * '7')",
          options: ["21", "777", "37", "Error"],
          correctAnswer: 1
        }
      ]
    }
  },
  // Add other programming modules here
};

const physicsModuleData: ModulesData = {
  "classical-mechanics": {
    title: "Classical Mechanics",
    description: "Understand the fundamental principles of motion, force, and energy.",
    level: "Beginner",
    icon: Atom,
    color: "purple",
    content: {
      overview: `
        <h2>Introduction to Classical Mechanics</h2>
        <p>Classical mechanics is the branch of physics dealing with the motion of macroscopic objects under the influence of forces. Developed by Sir Isaac Newton in the 17th century, it provides a framework to understand everyday phenomena, from falling apples to orbiting planets.</p>
        
        <h2>Key Concepts</h2>
        <ul>
          <li><strong>Newton's Laws of Motion:</strong> The three fundamental laws describing motion and forces</li>
          <li><strong>Conservation Laws:</strong> Principles stating that certain physical quantities remain constant</li>
          <li><strong>Kinematics:</strong> The study of motion without considering its causes</li>
          <li><strong>Dynamics:</strong> The study of forces and their effects on motion</li>
        </ul>
      `,
      lessons: [
        {
          title: "Newton's Laws",
          content: "Explore the three fundamental laws of motion that form the foundation of classical mechanics."
        },
        {
          title: "Conservation Laws",
          content: "Learn about the conservation of momentum, energy, and angular momentum in physical systems."
        },
        {
          title: "Kinematics",
          content: "Study the mathematical description of motion: displacement, velocity, and acceleration."
        },
        {
          title: "Dynamics",
          content: "Examine how forces affect the motion of objects and systems."
        }
      ],
      quiz: [
        {
          question: "What is Newton's First Law of Motion also known as?",
          options: [
            "Law of Conservation of Energy",
            "Law of Inertia",
            "Law of Action and Reaction",
            "Law of Acceleration"
          ],
          correctAnswer: 1
        },
        {
          question: "Which equation represents Newton's Second Law?",
          options: ["F = mv", "F = ma", "F = m/a", "F = m²a"],
          correctAnswer: 1
        },
        {
          question: "What does the conservation of momentum state?",
          options: [
            "Energy cannot be created or destroyed",
            "Mass remains constant in a closed system",
            "The total momentum of a closed system remains constant",
            "The speed of an object never changes"
          ],
          correctAnswer: 2
        },
        {
          question: "What is the unit of force in the International System of Units (SI)?",
          options: ["Joule", "Newton", "Pascal", "Watt"],
          correctAnswer: 1
        }
      ]
    }
  },
  // Add other physics modules here
};

// Combine all module data for easy lookup
const allModules: ModulesData = {
  ...aiModuleData,
  ...programmingModuleData,
  ...physicsModuleData
};

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const moduleId = typeof params.moduleId === 'string' ? params.moduleId : '';
  const moduleData = allModules[moduleId];
  
  // Handle case where module doesn't exist
  useEffect(() => {
    if (!moduleData && moduleId) {
      router.push('/learning-lab');
    }
  }, [moduleData, moduleId, router]);
  
  if (!moduleData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Module Not Found</h1>
          <p className="text-gray-300 mb-6">The module you're looking for doesn't exist.</p>
          <Link 
            href="/learning-lab" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
          >
            Return to Learning Lab
          </Link>
        </div>
      </div>
    );
  }
  
  const IconComponent = moduleData.icon;
  const colorClass = {
    blue: "text-blue-500",
    green: "text-green-500",
    purple: "text-purple-500"
  }[moduleData.color];
  
  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answerIndex;
    setQuizAnswers(newAnswers);
  };
  
  const handleQuizSubmit = () => {
    const quiz = moduleData.content.quiz;
    if (!quiz) return;
    
    let correctCount = 0;
    quizAnswers.forEach((answer, index) => {
      if (answer === quiz[index].correctAnswer) {
        correctCount++;
      }
    });
    
    setQuizScore((correctCount / quiz.length) * 100);
    setShowResults(true);
  };
  
  const resetQuiz = () => {
    setQuizAnswers([]);
    setQuizScore(null);
    setShowResults(false);
  };

  const startConversation = () => {
    // Save module data to session storage
    sessionStorage.setItem('selectedModule', JSON.stringify({
      id: moduleId,
      title: moduleData.title,
      description: moduleData.description
    }));
    
    // Navigate to the module conversation page
    router.push(`/module-conversation/${moduleId}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Module Header */}
        <div className="flex items-center mb-8">
          <Link 
            href="/learning-lab" 
            className="mr-4 text-gray-400 hover:text-white transition"
          >
            ← Back
          </Link>
          <div className="flex-1">
            <div className="flex items-center">
              <IconComponent className={`h-8 w-8 ${colorClass} mr-3`} />
              <h1 className="text-3xl font-bold">{moduleData.title}</h1>
            </div>
            <p className="text-gray-300 mt-2">{moduleData.description}</p>
            <div className="mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-${moduleData.color}-500/20 ${colorClass}`}>
                {moduleData.level}
              </span>
            </div>
          </div>
          <button 
            onClick={startConversation}
            className={`px-4 py-2 rounded bg-${moduleData.color}-600 hover:bg-${moduleData.color}-700 text-white transition flex items-center`}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat with AI Tutor
          </button>
        </div>
        
        {/* Module Content */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="lessons" className="flex items-center">
              <Book className="w-4 h-4 mr-2" />
              Lessons
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center">
              <ListChecks className="w-4 h-4 mr-2" />
              Quiz
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Content */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: moduleData.content.overview }}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Lessons Content */}
          <TabsContent value="lessons" className="space-y-6">
            {moduleData.content.lessons.map((lesson: Lesson, index: number) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full ${colorClass} bg-${moduleData.color}-500/20 mr-3`}>
                      {index + 1}
                    </span>
                    <CardTitle>{lesson.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300 text-base">
                    {lesson.content}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          {/* Quiz Content */}
          <TabsContent value="quiz" className="space-y-6">
            {showResults ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="w-6 h-6 mr-2 text-yellow-500" />
                    Quiz Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-6xl font-bold mb-2">{Math.round(quizScore || 0)}%</div>
                    <p className="text-gray-300">
                      {quizScore && quizScore >= 70 ? 
                        'Great job! You have a good understanding of this topic.' : 
                        'Keep studying! Try reviewing the material and take the quiz again.'}
                    </p>
                  </div>
                  
                  <button
                    onClick={resetQuiz}
                    className={`w-full py-2 bg-${moduleData.color}-600 hover:bg-${moduleData.color}-700 text-white rounded transition`}
                  >
                    Try Again
                  </button>
                </CardContent>
              </Card>
            ) : (
              <>
                {moduleData.content.quiz.map((question: QuizQuestion, qIndex: number) => (
                  <Card key={qIndex} className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {qIndex + 1}. {question.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {question.options.map((option: string, oIndex: number) => (
                          <div 
                            key={oIndex}
                            className={`p-3 rounded cursor-pointer transition ${
                              quizAnswers[qIndex] === oIndex 
                                ? `bg-${moduleData.color}-500/30 border border-${moduleData.color}-500` 
                                : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                            onClick={() => handleQuizAnswer(qIndex, oIndex)}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <button
                  onClick={handleQuizSubmit}
                  disabled={quizAnswers.length !== moduleData.content.quiz.length}
                  className={`w-full py-3 bg-${moduleData.color}-600 hover:bg-${moduleData.color}-700 
                    text-white rounded transition ${
                    quizAnswers.length !== moduleData.content.quiz.length ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Submit Answers
                </button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 