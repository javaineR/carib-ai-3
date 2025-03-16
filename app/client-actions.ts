"use client";

// This is a client-side version of the actions file for static export
// It provides mock implementations of server actions

// Mock data for modules
const mockModules = [
  {
    title: "AI Fundamentals",
    description: "Learn the basics of artificial intelligence, including key concepts and terminology.",
    learningObjectives: [
      "Understand the definition and scope of artificial intelligence",
      "Identify different types of machine learning approaches",
      "Recognize key AI terminology and concepts",
      "Discuss ethical considerations in AI development"
    ],
    topics: [
      {
        title: "Introduction to AI",
        content: "Artificial Intelligence (AI) refers to systems or machines that mimic human intelligence to perform tasks and can iteratively improve themselves based on the information they collect.",
        subtopics: ["History of AI", "Types of AI", "Applications of AI"],
        keyTerms: [
          {
            term: "Machine Learning",
            simplifiedDefinition: "A subset of AI focused on building systems that learn from data"
          },
          {
            term: "Neural Networks",
            simplifiedDefinition: "Computing systems inspired by the human brain's biological neural networks"
          }
        ]
      }
    ],
    learningTools: {
      games: [
        {
          title: "AI Concepts Quiz",
          questions: [
            {
              question: "What is the main goal of artificial intelligence?",
              options: [
                "To replace human workers",
                "To simulate human intelligence in machines",
                "To create robots that look like humans",
                "To make computers faster"
              ],
              correctAnswer: "To simulate human intelligence in machines",
              explanation: "AI aims to create systems that can perform tasks that typically require human intelligence."
            }
          ]
        }
      ],
      flashcards: [
        {
          term: "Machine Learning",
          definition: "A subset of AI that provides systems the ability to automatically learn and improve from experience without being explicitly programmed.",
          simplifiedDefinition: "Teaching computers to learn from data and improve over time."
        }
      ],
      questionBank: [
        {
          question: "How does machine learning differ from traditional programming?",
          answer: "In traditional programming, developers write explicit rules for the computer to follow. In machine learning, the system learns patterns from data and develops its own rules."
        }
      ]
    }
  }
];

// Mock implementations of server actions
export async function translateTerm(term: string, definition: string) {
  return {
    success: true,
    translation: `Jamaican Creole: "${term}" mean ${definition} inna simple way fi understand.`
  };
}

export async function updateModule(moduleIndex: number, updatedModule: any) {
  return {
    success: true,
    message: "Module updated successfully (mock)"
  };
}

export async function answerQuestion(question: string, moduleContext: string) {
  return {
    success: true,
    answer: `Here is an answer to your question about ${moduleContext}: ${question}. This is a mock response for static export.`
  };
}

export async function deleteModule(moduleIndex: number) {
  return {
    success: true,
    message: "Module deleted successfully (mock)"
  };
}

export async function evaluateQuizAnswer(question: string, userAnswer: string, correctAnswer: string) {
  const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
  
  return {
    success: true,
    isCorrect,
    feedback: isCorrect 
      ? "Correct! Well done." 
      : `Incorrect. The correct answer is: ${correctAnswer}`
  };
}

export async function generateJamaicanVoice(text: string, isCreole: boolean = false) {
  return {
    success: false,
    shouldUseBrowserTTS: true,
    error: "Voice generation not available in static export"
  };
}

// Mock function to get modules
export async function getModules() {
  return mockModules;
}

// Export other mock functions as needed 