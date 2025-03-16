"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Brain, Code, Sparkles, Atom, Zap, Book, Microscope } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';

// Dynamically import Monaco Editor
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').catch(err => {
    console.error("Failed to load Monaco Editor:", err);
    return () => <div className="p-4 bg-red-900/50 text-white rounded">Failed to load code editor. Please refresh the page.</div>;
  }),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-96 bg-gray-900">
      <div className="animate-pulse text-gray-400">Loading editor...</div>
    </div>
  }
);

// AI module data
const aiModules = [
  {
    id: "ai-basics",
    title: "AI Fundamentals",
    description: "Learn the basics of artificial intelligence, including key concepts and terminology.",
    level: "Beginner",
    topics: ["What is AI?", "Machine Learning Basics", "Neural Networks", "AI Ethics"],
    link: "/learning-lab/module/ai-basics"
  },
  {
    id: "machine-learning",
    title: "Machine Learning",
    description: "Explore different machine learning algorithms and their applications.",
    level: "Intermediate",
    topics: ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Model Evaluation"],
    link: "/learning-lab/module/machine-learning"
  },
  {
    id: "deep-learning",
    title: "Deep Learning",
    description: "Dive deep into neural networks and advanced AI techniques.",
    level: "Advanced",
    topics: ["Deep Neural Networks", "Convolutional Networks", "Recurrent Networks", "Transformers"],
    link: "/learning-lab/module/deep-learning"
  },
  {
    id: "prompt-engineering",
    title: "Prompt Engineering",
    description: "Master the art of crafting effective prompts for large language models.",
    level: "Intermediate",
    topics: ["Prompt Structure", "Few-shot Learning", "Chain of Thought", "Parameter Optimization"],
    link: "/learning-lab/module/prompt-engineering"
  }
];

// Programming module data
const programmingModules = [
  {
    id: "python-basics",
    title: "Python Basics",
    description: "Start your programming journey with Python, one of the most beginner-friendly languages.",
    level: "Beginner",
    topics: ["Variables & Data Types", "Control Flow", "Functions", "Basic Data Structures"],
    link: "/learning-lab/module/python-basics"
  },
  {
    id: "javascript-essentials",
    title: "JavaScript Essentials",
    description: "Learn the language of the web and build interactive websites.",
    level: "Beginner",
    topics: ["Variables & Functions", "DOM Manipulation", "Asynchronous JS", "Modern JS Features"],
    link: "/learning-lab/module/javascript-essentials"
  },
  {
    id: "java-fundamentals",
    title: "Java Fundamentals",
    description: "Master object-oriented programming with Java.",
    level: "Intermediate",
    topics: ["OOP Concepts", "Classes & Objects", "Inheritance", "Exception Handling"],
    link: "/learning-lab/module/java-fundamentals"
  }
];

// Physics module data
const physicsModules = [
  {
    id: "classical-mechanics",
    title: "Classical Mechanics",
    description: "Understand the fundamental principles of motion, force, and energy.",
    level: "Beginner",
    topics: ["Newton's Laws", "Conservation Laws", "Kinematics", "Dynamics"],
    link: "/learning-lab/module/classical-mechanics"
  },
  {
    id: "electricity-magnetism",
    title: "Electricity & Magnetism",
    description: "Explore the fascinating world of electric and magnetic fields.",
    level: "Intermediate",
    topics: ["Electric Fields", "Magnetic Fields", "Electromagnetic Induction", "Circuit Analysis"],
    link: "/learning-lab/module/electricity-magnetism"
  },
  {
    id: "quantum-physics",
    title: "Quantum Physics",
    description: "Dive into the strange quantum world that governs atomic and subatomic particles.",
    level: "Advanced",
    topics: ["Wave-Particle Duality", "Schrödinger's Equation", "Quantum States", "Quantum Entanglement"],
    link: "/learning-lab/module/quantum-physics"
  }
];

export default function LearningLabPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('modules'); // Default to modules tab
  const [code, setCode] = useState('// Write your code here\n\nfunction hello() {\n  console.log("Hello, world!");\n}\n\nhello();');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ai');

  // Set the active tab based on URL params when the component mounts
  useEffect(() => {
    const moduleParam = searchParams.get('module');
    const categoryParam = searchParams.get('category');
    
    if (moduleParam) {
      setActiveTab('modules');
    }
    
    if (categoryParam && (categoryParam === 'ai' || categoryParam === 'programming' || categoryParam === 'physics')) {
      setSelectedCategory(categoryParam);
      setActiveTab('modules');
    }
  }, [searchParams]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleQuerySubmit = async () => {
    if (!query.trim()) {
      setResponse('Please enter a question.');
      return;
    }
    
    setIsLoading(true);
    setResponse('');
    
    try {
      const res = await fetch('/api/gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: query }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setResponse(data.text || 'No response received.');
      } else {
        setResponse(`Error: ${data.error || 'Failed to get response'}`);
      }
    } catch (error) {
      setResponse('An unexpected error occurred. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  const handleModuleSelect = (moduleLink: string) => {
    router.push(moduleLink);
  };

  const executeCode = () => {
    if (!code.trim()) {
      setOutput('No code to execute.');
      return;
    }

    setOutput('Executing code...');
    
    // For JavaScript, we can use a try-catch and eval
    // This is a simplified version - in a real app you would want to use a sandbox
    if (language === 'javascript') {
      try {
        // Create a function to capture console.log output
        let logs: string[] = [];
        const originalConsoleLog = console.log;
        console.log = (...args) => {
          logs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
          originalConsoleLog(...args);
        };
        
        // Execute the code
        try {
          // Use Function constructor to prevent access to local scope
          new Function(code)();
          
          if (logs.length === 0) {
            logs.push('Code executed successfully, but no output was generated.');
          }
          
          setOutput(logs.join('\n'));
        } finally {
          // Restore original console.log
          console.log = originalConsoleLog;
        }
      } catch (error) {
        if (error instanceof Error) {
          setOutput(`Error: ${error.message}`);
        } else {
          setOutput('An unknown error occurred.');
        }
      }
    } else {
      // For other languages, we'd need a backend service
      setOutput(`Executing ${language} code requires a backend service. This is a demo only.`);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-900 text-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-center">Interactive Learning Lab</h1>
      
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-center">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              className={`py-2 px-6 rounded-l-lg font-medium ${activeTab === 'modules' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              onClick={() => setActiveTab('modules')}
            >
              Learning Modules
            </button>
            <button
              className={`py-2 px-6 font-medium ${activeTab === 'code' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              onClick={() => setActiveTab('code')}
            >
              Code Environment
            </button>
            <button
              className={`py-2 px-6 rounded-r-lg font-medium ${activeTab === 'chat' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              onClick={() => setActiveTab('chat')}
            >
              AI Assistant
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto">
        {/* Learning Modules */}
        {activeTab === 'modules' && (
          <div className="mt-4">
            {/* Category Navigation */}
            <div className="mb-8 flex justify-center">
              <div className="inline-flex rounded-md shadow-sm">
                <button
                  className={`py-2 px-6 rounded-l-lg font-medium ${selectedCategory === 'ai' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => setSelectedCategory('ai')}
                >
                  <div className="flex items-center">
                    <Brain className="h-4 w-4 mr-2" />
                    AI Learning
                  </div>
                </button>
                <button
                  className={`py-2 px-6 font-medium ${selectedCategory === 'programming' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => setSelectedCategory('programming')}
                >
                  <div className="flex items-center">
                    <Code className="h-4 w-4 mr-2" />
                    Programming
                  </div>
                </button>
                <button
                  className={`py-2 px-6 rounded-r-lg font-medium ${selectedCategory === 'physics' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => setSelectedCategory('physics')}
                >
                  <div className="flex items-center">
                    <Atom className="h-4 w-4 mr-2" />
                    Physics
                  </div>
                </button>
              </div>
            </div>

            {/* AI Modules */}
            {selectedCategory === 'ai' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {aiModules.map((module) => (
                  <Card key={module.id} className="bg-gray-800 border-gray-700 transition-transform duration-300 hover:scale-105">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Brain className="h-6 w-6 text-blue-500 mb-2" />
                        <span className="text-sm text-blue-400 font-medium bg-blue-400/10 px-2 py-1 rounded">
                          {module.level}
                        </span>
                      </div>
                      <CardTitle className="text-white">{module.title}</CardTitle>
                      <CardDescription className="text-gray-300">{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-200">
                        <h4 className="font-medium mb-2">Topics covered:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {module.topics.map((topic, i) => (
                            <li key={i}>{topic}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={module.link} className="w-full">
                        <button
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                        >
                          Start Learning
                        </button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* Programming Modules */}
            {selectedCategory === 'programming' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {programmingModules.map((module) => (
                  <Card key={module.id} className="bg-gray-800 border-gray-700 transition-transform duration-300 hover:scale-105">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Code className="h-6 w-6 text-green-500 mb-2" />
                        <span className="text-sm text-green-400 font-medium bg-green-400/10 px-2 py-1 rounded">
                          {module.level}
                        </span>
                      </div>
                      <CardTitle className="text-white">{module.title}</CardTitle>
                      <CardDescription className="text-gray-300">{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-200">
                        <h4 className="font-medium mb-2">Topics covered:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {module.topics.map((topic, i) => (
                            <li key={i}>{topic}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={module.link} className="w-full">
                        <button
                          className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
                        >
                          Start Learning
                        </button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* Physics Modules */}
            {selectedCategory === 'physics' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {physicsModules.map((module) => (
                  <Card key={module.id} className="bg-gray-800 border-gray-700 transition-transform duration-300 hover:scale-105">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Atom className="h-6 w-6 text-purple-500 mb-2" />
                        <span className="text-sm text-purple-400 font-medium bg-purple-400/10 px-2 py-1 rounded">
                          {module.level}
                        </span>
                      </div>
                      <CardTitle className="text-white">{module.title}</CardTitle>
                      <CardDescription className="text-gray-300">{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-200">
                        <h4 className="font-medium mb-2">Topics covered:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {module.topics.map((topic, i) => (
                            <li key={i}>{topic}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={module.link} className="w-full">
                        <button
                          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition"
                        >
                          Start Learning
                        </button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat Interface */}
        {activeTab === 'chat' && (
          <div className="mt-4 max-w-2xl mx-auto">
            <div className="mb-6">
              <input
                type="text"
                value={query}
                onChange={handleQueryChange}
                className="w-full p-3 border border-gray-700 rounded bg-gray-800 text-white"
                placeholder="Ask any question..."
              />
              <button
                onClick={handleQuerySubmit}
                disabled={isLoading}
                className="mt-2 w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
              >
                {isLoading ? 'Loading...' : 'Submit'}
              </button>
            </div>
            <div className={`p-4 rounded-lg border ${response ? 'border-gray-700 bg-gray-800' : ''}`}>
              {response ? (
                <div className="text-white whitespace-pre-wrap">{response}</div>
              ) : (
                <p className="text-gray-400 text-center">
                  {isLoading ? 'Thinking...' : 'Ask a question to get started'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Code Editor */}
        {activeTab === 'code' && (
          <div className="mt-4 max-w-4xl mx-auto">
            <div className="mb-4 flex items-center">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="mr-2 p-2 bg-gray-800 text-white border border-gray-700 rounded"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
              </select>
              <button
                onClick={executeCode}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
              >
                Run Code
              </button>
            </div>
            
            <div className="border border-gray-700 rounded overflow-hidden">
              <div className="h-96 relative">
                <MonacoEditor
                  height="100%"
                  language={language}
                  value={code}
                  onChange={handleCodeChange}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    automaticLayout: true,
                    tabSize: 2,
                    renderWhitespace: "selection",
                    formatOnPaste: true,
                    formatOnType: true
                  }}
                  onMount={(editor) => {
                    // Focus the editor when it mounts
                    editor.focus();
                  }}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-white text-lg font-semibold mb-2">Output:</h3>
              <div className="p-4 bg-black text-white font-mono rounded h-48 overflow-y-auto whitespace-pre">
                {output || 'Run your code to see the output here.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 