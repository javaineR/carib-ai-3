"use server"

import { revalidatePath } from "next/cache"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
// Remove parseDocument implementation since we now have it in a separate file
import { parseDocument } from "./document-actions"


declare global {
  var generatedModules: any[];
  var hasGeneratedModules: boolean;
}

// Initialize global variables if they don't exist
if (!global.generatedModules) {
  global.generatedModules = [];
}

if (typeof global.hasGeneratedModules === 'undefined') {
  global.hasGeneratedModules = false;
}

// Use global variables for persistence
let generatedModules = global.generatedModules;
let hasGeneratedModules = global.hasGeneratedModules;

export async function processSyllabus(formData: FormData) {
  try {
    const file = formData.get("file") as File
    if (!file) {
      throw new Error("No file provided")
    }

    // Check file size on the server side as well
    const maxFileSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxFileSize) {
      throw new Error("File size exceeds the maximum limit of 16MB")
    }

    // Additional file validation
    if (file.name.endsWith('.pdf')) {
      // Extra validation for PDF files
      // Check if file is empty
      if (file.size === 0) {
        throw new Error("The PDF file is empty. Please upload a valid file.")
      }
    }

    // Extract text using the separate server action from document-actions.ts
    let syllabusText
    try {
      console.log(`Processing syllabus file: ${file.name}`);
      syllabusText = await parseDocument(file)
      
      // Check if we got meaningful text
      if (!syllabusText || syllabusText.trim().length === 0) {
        throw new Error("Could not extract text from the document. The file might be image-based, protected, or corrupted.")
      }
      
      console.log(`Successfully extracted text from ${file.name}, length: ${syllabusText.length} characters`);
    } catch (parseError: any) {
      console.error("Document parsing error:", parseError)
      // Instead of failing completely, use a generic template that allows processing to continue
      syllabusText = `
Educational Document Analysis

This document appears to be educational material that can be organized into learning modules.
Each module should include:
- A clear topic title
- Step-by-step learning objectives
- Key terminology related to the topic

Document Filename: ${file.name}
Document Type: ${file.name.endsWith('.pdf') ? 'PDF' : 'DOCX'}
Document Size: ${(file.size / 1024).toFixed(2)} KB

The document couldn't be fully parsed, but the filename indicates it may be related to:
${file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")}
      `;
      console.log("Using fallback syllabusText with filename information due to parsing error");
    }

    // Limit text length for OpenAI processing
    const maxTextLength = 9000;
    const truncatedText = syllabusText.slice(0, maxTextLength);
    console.log(`Truncated text to ${truncatedText.length} characters for processing`);

    // We'll add a slight delay to make sure we're not hitting rate limits immediately
    console.log("Adding short delay before API calls...");
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate modules using OpenAI (with rate limiting)
    console.log("Generating modules using OpenAI...");
    let modules = [];
    try {
      // Try to generate modules with a shorter timeout (2 minutes instead of 5)
      const generatePromise = generateModules(truncatedText);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Module generation timed out after 2 minutes")), 2 * 60 * 1000);
      });
      
      // Race the promises to prevent hanging
      modules = await Promise.race([generatePromise, timeoutPromise]) as any[];
      console.log(`Successfully generated ${modules.length} modules`);
      
      // Check if we actually got modules with the right structure
      if (!modules || modules.length === 0 || !modules[0].title) {
        throw new Error("Generated modules are invalid or empty");
      }
    } catch (moduleError: any) {
      console.error("Error during module generation:", moduleError);
      
      // Create fallback module using the filename to make it relevant to the uploaded content
      const subjectGuess = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      
      modules = [{
        title: `${subjectGuess} Overview`,
        description: `A structured overview of key concepts in ${subjectGuess}.`,
        learningObjectives: [
          `Understand the fundamental concepts in ${subjectGuess}`,
          `Identify key principles and their applications in ${subjectGuess}`,
          `Apply learning strategies to master ${subjectGuess} content`
        ],
        topics: [
          {
            title: `Introduction to ${subjectGuess}`,
            content: `This topic covers the fundamental aspects of ${subjectGuess}, providing a foundation for understanding the material.`,
            subtopics: [`${subjectGuess} fundamentals`, `Key concepts in ${subjectGuess}`, `Learning objectives for ${subjectGuess}`],
            keyTerms: [
              {
                term: subjectGuess,
                simplifiedDefinition: `The study of ${subjectGuess} concepts and applications`,
                examples: [`Real-world applications of ${subjectGuess}`]
              }
            ]
          },
          {
            title: `Core Concepts in ${subjectGuess}`,
            content: `An exploration of the central ideas and principles of ${subjectGuess}.`,
            subtopics: [`${subjectGuess} principles`, `Important theories in ${subjectGuess}`, `Practical applications of ${subjectGuess}`],
            keyTerms: [
              {
                term: `${subjectGuess} Principle`,
                simplifiedDefinition: `A fundamental truth or proposition that serves as the foundation for ${subjectGuess}`,
                examples: [`How ${subjectGuess} principles apply in real situations`]
              }
            ]
          }
        ],
        learningTools: {
          games: [
            {
              title: `${subjectGuess} Knowledge Check`,
              questions: [
                {
                  question: `What is the primary focus of ${subjectGuess}?`,
                  options: [
                    `Understanding theoretical concepts`,
                    `Applying principles to real-world situations`,
                    `Memorizing definitions`,
                    `Taking tests`
                  ],
                  correctAnswer: `Applying principles to real-world situations`,
                  explanation: `${subjectGuess} is primarily concerned with the practical application of principles to solve real-world problems, not just memorizing concepts.`,
                  difficulty: "medium",
                  tags: ["application", "concepts"]
                },
                {
                  question: `Which approach is most effective when studying ${subjectGuess}?`,
                  options: [
                    `Memorizing all definitions without understanding`,
                    `Skipping difficult concepts`,
                    `Regular practice with diverse examples`,
                    `Focusing only on theory`
                  ],
                  correctAnswer: `Regular practice with diverse examples`,
                  explanation: `Effective learning in ${subjectGuess} requires regular practice with varied examples to build understanding and flexibility in applying concepts.`,
                  difficulty: "easy",
                  tags: ["study skills", "learning"]
                },
                {
                  question: `What distinguishes experts in ${subjectGuess} from beginners?`,
                  options: [
                    `Ability to memorize more facts`,
                    `Pattern recognition and strategic thinking`,
                    `Working faster but with the same methods`,
                    `Using more complicated tools`
                  ],
                  correctAnswer: `Pattern recognition and strategic thinking`,
                  explanation: `Experts in ${subjectGuess} develop pattern recognition skills that allow them to quickly identify situations and apply appropriate strategies.`,
                  difficulty: "medium",
                  tags: ["expertise", "skills"]
                },
                {
                  question: `How should feedback be used in learning ${subjectGuess}?`,
                  options: [
                    `Ignore it if it points out mistakes`,
                    `Use it to identify areas for improvement`,
                    `Only accept positive feedback`,
                    `Feedback isn't important in ${subjectGuess}`
                  ],
                  correctAnswer: `Use it to identify areas for improvement`,
                  explanation: `Constructive feedback is valuable in learning ${subjectGuess} as it helps identify specific areas where understanding can be improved.`,
                  difficulty: "easy",
                  tags: ["feedback", "improvement"]
                },
                {
                  question: `What role does critical thinking play in ${subjectGuess}?`,
                  options: [
                    `It's unnecessary for basic understanding`,
                    `It's only important for advanced topics`,
                    `It's fundamental to analyzing and solving problems`,
                    `It makes learning more difficult`
                  ],
                  correctAnswer: `It's fundamental to analyzing and solving problems`,
                  explanation: `Critical thinking is essential in ${subjectGuess} as it enables you to analyze problems, evaluate approaches, and develop effective solutions.`,
                  difficulty: "medium",
                  tags: ["critical thinking", "problem-solving"]
                },
                {
                  question: `When faced with a new problem in ${subjectGuess}, what should be your first step?`,
                  options: [
                    `Immediately look for the answer online`,
                    `Give up if the solution isn't obvious`,
                    `Carefully analyze the problem to understand it`,
                    `Apply random techniques until something works`
                  ],
                  correctAnswer: `Carefully analyze the problem to understand it`,
                  explanation: `The first step in problem-solving is thorough analysis to ensure you completely understand the problem before attempting a solution.`,
                  difficulty: "medium",
                  tags: ["problem-solving", "methodology"]
                },
                {
                  question: `What is the value of collaborative learning in ${subjectGuess}?`,
                  options: [
                    `It only helps struggling students`,
                    `It exposes you to different perspectives and approaches`,
                    `It's less effective than studying alone`,
                    `It's only useful for group projects`
                  ],
                  correctAnswer: `It exposes you to different perspectives and approaches`,
                  explanation: `Collaborative learning in ${subjectGuess} offers exposure to diverse perspectives and solution strategies that can enhance your own understanding.`,
                  difficulty: "easy",
                  tags: ["collaboration", "learning strategies"]
                },
                {
                  question: `How important is understanding the underlying principles in ${subjectGuess}?`,
                  options: [
                    `Not important - memorizing procedures is sufficient`,
                    `Somewhat important but secondary to practice`,
                    `Crucial - it enables application in varied contexts`,
                    `Only important for theoretical work`
                  ],
                  correctAnswer: `Crucial - it enables application in varied contexts`,
                  explanation: `Understanding the fundamental principles of ${subjectGuess} is essential for applying knowledge flexibly across different situations and problems.`,
                  difficulty: "hard",
                  tags: ["principles", "understanding"]
                },
                {
                  question: `What should you do when you encounter a concept in ${subjectGuess} that seems contradictory?`,
                  options: [
                    `Ignore it and focus on simpler concepts`,
                    `Accept it without questioning`,
                    `Investigate to resolve the apparent contradiction`,
                    `Assume your understanding of other concepts is wrong`
                  ],
                  correctAnswer: `Investigate to resolve the apparent contradiction`,
                  explanation: `When encountering seemingly contradictory information in ${subjectGuess}, deeper investigation often reveals nuances that resolve the contradiction.`,
                  difficulty: "hard",
                  tags: ["conceptual understanding", "critical thinking"]
                },
                {
                  question: `What is the most effective way to retain knowledge in ${subjectGuess}?`,
                  options: [
                    `Cramming before exams`,
                    `Reading the textbook once thoroughly`,
                    `Regular retrieval practice and application`,
                    `Highlighting important passages in study materials`
                  ],
                  correctAnswer: `Regular retrieval practice and application`,
                  explanation: `Research shows that actively retrieving information through practice tests and applying knowledge to problems significantly improves long-term retention in ${subjectGuess}.`,
                  difficulty: "medium",
                  tags: ["learning techniques", "retention"]
                }
              ]
            }
          ],
          flashcards: [
            {
              term: subjectGuess,
              definition: `The study and application of ${subjectGuess} principles and concepts`,
              simplifiedDefinition: `Learning about ${subjectGuess} and how to use it`,
              creoleDefinition: `Di way wi lern bout ${subjectGuess} an ow fi use it`
            }
          ],
          questionBank: [
            {
              question: `How can I improve my understanding of ${subjectGuess}?`,
              answer: `To improve your understanding of ${subjectGuess}, focus on the core concepts, practice applying the principles in different contexts, and relate the material to real-world examples.`
            }
          ]
        }
      }];
      console.log(`Created fallback module related to ${subjectGuess}`);
    }

    // Clear previous modules and store the new ones
    global.generatedModules = [];
    global.generatedModules = modules;
    global.hasGeneratedModules = true;
    
    // Update local references
    generatedModules = global.generatedModules;
    hasGeneratedModules = global.hasGeneratedModules;
    
    console.log(`Stored ${generatedModules.length} modules in memory. First module title: "${generatedModules[0]?.title}"`);

    // Revalidate both paths to ensure data is refreshed
    revalidatePath("/modules");
    revalidatePath("/");
    
    return { success: true }
  } catch (error: any) {
    console.error("Error processing syllabus:", error);
    return { 
      success: false, 
      error: error.message || "An unknown error occurred while processing the syllabus" 
    };
  }
}

export async function getGeneratedModules() {
  try {
    // Update references to global state
    generatedModules = global.generatedModules;
    hasGeneratedModules = global.hasGeneratedModules;
    
    console.log(`Retrieving modules: ${generatedModules.length} modules found in memory`);
    console.log(`Has generated modules flag: ${hasGeneratedModules}`);
    
    // If we have modules in memory, return them
    if (generatedModules && Array.isArray(generatedModules) && generatedModules.length > 0) {
      console.log(`Returning ${generatedModules.length} modules. First module title: "${generatedModules[0]?.title}"`);
      return generatedModules;
    }
    
    // Only return default modules if this is the first time
    if (!hasGeneratedModules) {
      console.log("No modules found, returning default modules for first-time visit");
      return getDefaultModules();
    } else {
      // If we've already generated modules but they're now empty, something went wrong
      console.log("Warning: Modules were previously generated but are now empty");
      return [];
    }
  } catch (error) {
    console.error("Error in getGeneratedModules:", error);
    if (!hasGeneratedModules) {
      return getDefaultModules();
    }
    return [];
  }
}

// Function to validate and fix module structure
function validateModuleStructure(modules: any[]) {
  if (!modules || !Array.isArray(modules) || modules.length === 0) {
    return [];
  }
  
  return modules.filter(module => {
    // Validate basic structure
    if (!module || typeof module !== 'object') return false;
    if (!module.title || typeof module.title !== 'string') return false;
    
    // Check if module has the new structure
    const hasNewStructure = module.description && 
                           Array.isArray(module.topics) &&
                           module.learningTools &&
                           Array.isArray(module.learningTools.games) &&
                           Array.isArray(module.learningTools.flashcards) &&
                           Array.isArray(module.learningTools.questionBank);
    
    // If it has the new structure, it's valid
    if (hasNewStructure) return true;
    
    // If it has the old structure, we'll convert it (but log the issue)
    console.log(`Module "${module.title}" has old structure, will convert`);
    return false;
  });
}

// Function to get default modules
function getDefaultModules() {
  return [
    {
      title: "Example Module",
      description: "A demonstration of the module structure and interactive learning tools available on QuantumEd.",
      topics: [
        {
          title: "Getting Started with QuantumEd",
          content: "Learn how to use the platform effectively to enhance your educational experience.",
          subtopics: [
            "Upload a syllabus to generate personalized modules", 
            "Review the generated content", 
            "Explore each module's interactive learning tools"
          ]
        }
      ],
      learningTools: {
        games: [
          {
            title: "Platform Basics Quiz",
            questions: [
              {
                question: "What can you upload to generate modules?",
                options: [
                  "Videos",
                  "Images",
                  "Syllabus documents",
                  "Audio files"
                ],
                correctAnswer: "Syllabus documents",
                explanation: "QuantumEd allows you to upload syllabus documents, which are then processed to generate customized learning modules based on the content. This helps create a personalized learning experience.",
                difficulty: "easy",
                tags: ["platform", "basics"]
              },
              {
                question: "Which learning tool helps with term definitions?",
                options: [
                  "Quizzes",
                  "Flashcards",
                  "Question Bank",
                  "Notes"
                ],
                correctAnswer: "Flashcards",
                explanation: "Flashcards are specifically designed to help you learn definitions of terms. Each flashcard contains a term on one side and its definition on the other, making them ideal for memorizing terminology.",
                difficulty: "easy",
                tags: ["platform", "tools"]
              },
              {
                question: "How does QuantumEd generate personalized content?",
                options: [
                  "By copying content from Wikipedia",
                  "By using AI to analyze your syllabus",
                  "By having teachers manually create modules",
                  "By reusing generic educational materials"
                ],
                correctAnswer: "By using AI to analyze your syllabus",
                explanation: "QuantumEd leverages advanced AI technology to analyze the content of your syllabus, identifying key topics, learning objectives, and terminology to create customized learning modules that match your specific educational needs.",
                difficulty: "medium",
                tags: ["AI", "content generation"]
              },
              {
                question: "What types of interactive learning tools does QuantumEd offer?",
                options: [
                  "Only videos and podcasts",
                  "Only quizzes and tests",
                  "Quizzes, flashcards, and question banks",
                  "Only collaborative group projects"
                ],
                correctAnswer: "Quizzes, flashcards, and question banks",
                explanation: "QuantumEd provides a comprehensive set of interactive learning tools including quizzes to test your knowledge, flashcards for term memorization, and question banks for deeper understanding and practice.",
                difficulty: "easy",
                tags: ["platform", "tools"]
              },
              {
                question: "What can you do with generated modules in QuantumEd?",
                options: [
                  "Only view them",
                  "View and edit them",
                  "Only download them",
                  "Only share them"
                ],
                correctAnswer: "View and edit them",
                explanation: "QuantumEd allows you to not only view the AI-generated modules but also edit them to customize the content according to your preferences or educational needs.",
                difficulty: "medium",
                tags: ["platform", "features"]
              },
              {
                question: "Which feature helps with pronunciation and listening comprehension?",
                options: [
                  "Text-to-speech functionality",
                  "Interactive videos",
                  "Written transcripts",
                  "Peer discussions"
                ],
                correctAnswer: "Text-to-speech functionality",
                explanation: "QuantumEd includes text-to-speech functionality that reads content aloud, helping with pronunciation and listening comprehension, which is particularly useful for language learning and accessibility.",
                difficulty: "medium",
                tags: ["accessibility", "features"]
              },
              {
                question: "What makes QuantumEd's approach to education unique?",
                options: [
                  "It only uses traditional teaching methods",
                  "It focuses exclusively on STEM subjects",
                  "It personalizes content based on individual syllabi",
                  "It requires in-person instruction"
                ],
                correctAnswer: "It personalizes content based on individual syllabi",
                explanation: "QuantumEd's unique approach lies in its ability to analyze individual syllabi and create personalized learning content tailored to specific educational needs, rather than offering generic one-size-fits-all materials.",
                difficulty: "hard",
                tags: ["platform", "personalization"]
              },
              {
                question: "How can you track your learning progress in QuantumEd?",
                options: [
                  "Through quiz performance and completion statistics",
                  "By manually recording your study time",
                  "Only through teacher assessments",
                  "Progress tracking is not available"
                ],
                correctAnswer: "Through quiz performance and completion statistics",
                explanation: "QuantumEd tracks your learning progress through quiz performance metrics and completion statistics, giving you insights into your strengths and areas that need improvement.",
                difficulty: "medium",
                tags: ["progress tracking", "features"]
              },
              {
                question: "What language support features does QuantumEd offer?",
                options: [
                  "Only English content",
                  "Translation into major European languages only",
                  "Term translations into Jamaican Creole",
                  "Full content in 50+ languages"
                ],
                correctAnswer: "Term translations into Jamaican Creole",
                explanation: "QuantumEd offers term translations into Jamaican Creole, helping to make educational content more accessible to Jamaican students and promoting cultural inclusivity in education.",
                difficulty: "medium",
                tags: ["language support", "accessibility"]
              },
              {
                question: "What is the main purpose of the Question Bank feature?",
                options: [
                  "To store questions for future quizzes",
                  "To provide AI-powered answers to your subject questions",
                  "To test memorization skills",
                  "To generate exam questions"
                ],
                correctAnswer: "To provide AI-powered answers to your subject questions",
                explanation: "The Question Bank feature uses AI to provide detailed, educational answers to your specific subject matter questions, serving as an interactive learning assistant that helps deepen your understanding of complex topics.",
                difficulty: "hard",
                tags: ["AI features", "tools"]
              }
            ]
          }
        ],
        flashcards: [
          {
            term: "Module",
            definition: "A self-contained unit of study focused on a specific topic that organizes educational content into manageable sections for effective learning.",
            simplifiedDefinition: "A package of learning materials about one specific topic that helps you learn step by step.",
            creoleDefinition: "Wan paat a di edukieshan we fuokos pan wan speshal tapik an kyan stan bai iself fi mek yu lorn betta."
          },
          {
            term: "Syllabus",
            definition: "A document that outlines the topics, requirements, and learning objectives of an educational course, serving as a roadmap for students.",
            simplifiedDefinition: "A guide that shows what you'll learn in a course and what you need to do.",
            creoleDefinition: "Di paypa we tel yu wa yu a go lorn an wa yu niid fi du ina di klaas, laik wan map fi di koors."
          },
          {
            term: "Learning Objective",
            definition: "A clear statement of what students should be able to know, understand, or do after completing a learning activity or course.",
            simplifiedDefinition: "The specific skills or knowledge you should gain after finishing a lesson.",
            creoleDefinition: "Di ting dem we yu fi nuo ar kyan du afta yu don lorn di lesn. A di pint a di uol ting."
          },
          {
            term: "Critical Thinking",
            definition: "The intellectually disciplined process of actively analyzing, synthesizing, and evaluating information gathered from observation, experience, or communication.",
            simplifiedDefinition: "The skill of carefully examining ideas and information to form well-reasoned judgments.",
            creoleDefinition: "Wen yu tink bout somting gud-gud an nuh jos tek it so, bot yu analaiz it an mek yu uon jojment bout it."
          },
          {
            term: "Flashcard",
            definition: "A learning tool consisting of a card with information such as a term on one side and its definition on the other, used for memorization through repeated practice.",
            simplifiedDefinition: "A card with a word on one side and its meaning on the other, used to help remember information.",
            creoleDefinition: "Wan likl kaad we av wod pan wan said an di miinin pan di ada said fi elp yu memba tingz wen yu praktis."
          },
          {
            term: "Quiz",
            definition: "A brief assessment designed to measure a student's knowledge, skills, or understanding of specific content through a series of questions.",
            simplifiedDefinition: "A short test with questions to check what you've learned.",
            creoleDefinition: "Wan shaat tes wid som kwestyan dem fi chek if yu andastan wa yu lorn."
          },
          {
            term: "Personalized Learning",
            definition: "An educational approach that tailors the learning experience to individual students' needs, preferences, and pace to optimize their learning outcomes.",
            simplifiedDefinition: "Learning that's adjusted to fit your specific needs and how you learn best.",
            creoleDefinition: "Wen di edukieshan set op fi fit ow yu lorn bes, no jos di siem wie fi evrybadi."
          },
          {
            term: "Artificial Intelligence",
            definition: "The simulation of human intelligence processes by machines, especially computer systems, including learning, reasoning, and self-correction.",
            simplifiedDefinition: "Technology that can learn, solve problems, and make decisions similar to humans.",
            creoleDefinition: "Kompyuuta teknaloji we kyan tink, lorn, an salv prablem dem laik ou pipl du."
          },
          {
            term: "Educational Technology",
            definition: "The use of technological tools, resources, and systems to improve learning experiences and educational outcomes for students.",
            simplifiedDefinition: "Tools and software designed to help people learn more effectively.",
            creoleDefinition: "Di teknaloji dem we wi yuuz fi mek pipl lorn betta an muo iizi."
          },
          {
            term: "Comprehension",
            definition: "The ability to understand and interpret information, demonstrating a thorough grasp of the meaning and significance of content.",
            simplifiedDefinition: "Understanding what you read or hear, not just recognizing the words.",
            creoleDefinition: "Wen yu riili andastan wa yu riid ar ier, no jos nuo di wod dem bot wa dem miin."
          },
          {
            term: "Assessment",
            definition: "The process of gathering and evaluating information about a student's knowledge, skills, or understanding to measure learning progress.",
            simplifiedDefinition: "Ways to check and measure what you've learned and how well you understand it.",
            creoleDefinition: "Di wie dem we wi chek fi si wa yu lorn an ou gud yu andastan it."
          },
          {
            term: "Curriculum",
            definition: "A planned sequence of learning experiences and instructional materials designed to help students achieve specific educational objectives.",
            simplifiedDefinition: "The complete set of courses and their content offered by a school or program.",
            creoleDefinition: "Di uol set a tingz we dem plan fi tiich yu iina skuul, fram staat tu finish."
          },
          {
            term: "Pedagogy",
            definition: "The method and practice of teaching, especially as an academic subject or theoretical concept, encompassing teaching styles and strategies.",
            simplifiedDefinition: "The science and art of how to teach effectively.",
            creoleDefinition: "Di saiens an aat a ou fi tiich gud, di wie ou set op di lornin fi mek it werk."
          },
          {
            term: "Blended Learning",
            definition: "An educational approach that combines online digital media with traditional classroom methods, requiring the physical presence of both teacher and student.",
            simplifiedDefinition: "Learning that mixes online activities with face-to-face classroom teaching.",
            creoleDefinition: "Wen yu lorn som a di taim pan kompyuuta an som a di taim ina di klasroom wid di tiicha."
          },
          {
            term: "Cognitive Skills",
            definition: "The core mental abilities used to think, read, learn, remember, reason, and pay attention, which are crucial for processing and applying information.",
            simplifiedDefinition: "Mental abilities that help you process information, solve problems, and learn.",
            creoleDefinition: "Di brainpowa we yu yuuz fi tink, memba tingz, salv prablem, an andastan wa yu a lorn."
          },
          {
            term: "Formative Assessment",
            definition: "Ongoing evaluation during the learning process that provides feedback to adjust teaching and learning for better outcomes.",
            simplifiedDefinition: "Checks done during learning to help improve teaching and understanding.",
            creoleDefinition: "Di tes dem we yu du wail yu a lorn, no jos at di end, fi elp yu get betta."
          },
          {
            term: "Summative Assessment",
            definition: "Evaluation conducted at the end of a learning period to measure achievement against a standard or benchmark.",
            simplifiedDefinition: "Tests or projects at the end of a course to see how much you've learned overall.",
            creoleDefinition: "Di big tes dem at di end a di koors fi si ou moch yu lorn pan di uol ting."
          },
          {
            term: "Metacognition",
            definition: "Awareness and understanding of one's own thought processes, including the ability to monitor, regulate, and direct one's learning strategies.",
            simplifiedDefinition: "Thinking about your own thinking and learning processes.",
            creoleDefinition: "Wen yu tink bout ou yu tink, an nuo ou yu lorn bes, so yu kyan mek it betta."
          },
          {
            term: "Differentiated Instruction",
            definition: "A teaching approach that tailors instruction to meet individual student needs by adjusting content, process, or product based on readiness, interest, or learning profile.",
            simplifiedDefinition: "Teaching methods that adapt to different students' needs and learning styles.",
            creoleDefinition: "Wen di tiicha chienj op ou dem tiich bies pan ou difrant stuudent dem lorn bes."
          },
          {
            term: "Active Learning",
            definition: "An approach to instruction that engages students in the learning process through activities, discussions, and reflection rather than passive listening.",
            simplifiedDefinition: "Learning by doing and participating, not just by listening or reading.",
            creoleDefinition: "Wen yu lorn bai du tingz, no jos lisn. Yu get involvd, chat bout it, an praktis it."
          }
        ],
        questionBank: [
          {
            question: "How do I create my own modules?",
            answer: "Navigate to the 'Create Modules' page and upload your syllabus document. The AI will process it and generate interactive learning modules tailored to your content."
          },
          {
            question: "Can I edit the generated modules?",
            answer: "Yes, you can edit any module by clicking the Edit button. This allows you to customize the content, add new questions, or modify the existing materials."
          }
        ]
      }
    }
  ];
}

export async function updateModule(index: number, content: string) {
  try {
    // Ensure we're using the latest global state
    generatedModules = global.generatedModules;
    
    if (index >= 0 && index < generatedModules.length) {
      // Parse the content and validate it has the expected structure
      const updatedModule = JSON.parse(content);
      
      // Update the entire module at that index
      generatedModules[index] = updatedModule;
      
      // Update global state
      global.generatedModules = generatedModules;
      
      // Revalidate the path to update the UI
      revalidatePath("/");
      return { success: true };
    }
    return { success: false, error: "Invalid module index" };
  } catch (error) {
    console.error("Error updating module:", error);
    return { success: false, error: "Failed to parse module content" };
  }
}

export async function translateTerm(term: string) {
  try {
    // Using AI SDK directly (could be replaced with our gpt.ts utility)
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Translate the following technical term into authentic Jamaican Creole (Patois). 
      
Term: '${term}'

Your response should follow this EXACT format:
1. Brief explanation of the term in standard English (1-2 sentences)

2. Jamaican Creole:
[Jamaican Creole translation ONLY on this line]

3. Example sentence:
[Example usage in Jamaican Creole with English translation in parentheses]

Make sure the Creole translation:
- Uses authentic Jamaican Patois vocabulary, grammar, and syntax
- Is written phonetically to represent actual Jamaican pronunciation
- Reflects how a native Jamaican would naturally explain this concept
- Includes appropriate cultural references if relevant
- Uses the correct grammatical patterns of Jamaican Patois including:
  * Appropriate use of "di" as the definite article
  * Correct verb tense marking (e.g., "a" for progressive, "did" for past)
  * Proper use of pronouns (mi, yu, im, ar, wi, unu, dem)
  * Correct negation patterns with "no" or "nuh"

DO NOT use fake or stereotypical Patois - use authentic Jamaican Creole as spoken in Jamaica by native speakers.
DO NOT use Spanish or any other language - ONLY authentic Jamaican Patois.`,
      temperature: 0.7,
    })

    return { success: true, translation: text }
  } catch (error) {
    console.error("Error translating term:", error)
    return { success: false, error: "Failed to translate term" }
  }
}

export async function generateJamaicanVoice(text: string, voiceType: 'teacher' | 'student' = 'teacher') {
  try {
    const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
    
    // Voice IDs for different roles
    // "Oliva" voice ID (EXAVITQu4vr4xnSDxMaL) - a Caribbean voice for teacher
    // "Josh" voice ID (TxGEqnHWrfWFTfGW9XjX) - a deep male voice for student
    const VOICE_IDS = {
      teacher: "EXAVITQu4vr4xnSDxMaL", // Caribbean voice (Oliva)
      student: "TxGEqnHWrfWFTfGW9XjX"  // Deep male voice (Josh)
    };
    
    const VOICE_ID = VOICE_IDS[voiceType];
    
    if (!ELEVEN_LABS_API_KEY) {
      console.log("Eleven Labs API key not configured. Using fallback TTS method.");
      return { 
        success: false, 
        error: `Voice unavailable - API key not configured`,
        shouldUseBrowserTTS: true,
        voiceType
      };
    }
    
    // Check for text length - Eleven Labs may have limitations on text length
    // If text is too long, we'll only process the first chunk (in a production app, you'd handle this differently)
    const MAX_TEXT_LENGTH = 5000; // Characters - adjust based on Eleven Labs limitations
    let processedText = text;
    let isPartial = false;
    
    if (text.length > MAX_TEXT_LENGTH) {
      console.log(`Text exceeds maximum length (${text.length}/${MAX_TEXT_LENGTH}). Processing first chunk only.`);
      
      // Find a good breaking point
      let breakPoint = MAX_TEXT_LENGTH;
      while (breakPoint > 0 && !['.', '!', '?', '\n'].includes(text[breakPoint])) {
        breakPoint--;
      }
      
      // If no good breaking point found, use MAX_TEXT_LENGTH
      if (breakPoint === 0) breakPoint = MAX_TEXT_LENGTH;
      
      processedText = text.substring(0, breakPoint + 1);
      isPartial = true;
    }
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_LABS_API_KEY
      },
      body: JSON.stringify({
        text: processedText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.25,
          use_speaker_boost: true
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Eleven Labs API error: ${response.status} ${errorText}`);
    }
    
    // Get the audio data as an ArrayBuffer
    const audioData = await response.arrayBuffer();
    
    // Convert to base64
    const base64Audio = Buffer.from(audioData).toString('base64');
    
    return { 
      success: true, 
      audioData: `data:audio/mpeg;base64,${base64Audio}`,
      isPartial,
      voiceType
    };
  } catch (error) {
    console.error(`Error generating ${voiceType} voice:`, error);
    return { 
      success: false, 
      error: `Failed to generate ${voiceType} voice.`,
      shouldUseBrowserTTS: true,
      voiceType
    };
  }
}

export async function answerQuestion(question: string, moduleContext: string) {
  try {
    // Using AI SDK directly
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `You are an educational assistant helping a student understand a learning module.
      
Context about the module:
${moduleContext}

Question from student:
${question}

Please provide a helpful, educational answer that's:
1. Clear and concise
2. Accurate based on the provided context
3. Appropriate for educational purposes
4. Encouraging and supportive of further learning

Your answer:`,
      temperature: 0.7,
      maxTokens: 300
    });

    return { success: true, answer: text }
  } catch (error) {
    console.error("Error answering question:", error);
    return { success: false, error: "Unable to answer this question. Please try again later." }
  }
}

export async function evaluateQuizAnswer(question: string, options: string[], correctAnswer: string, userAnswer: string, moduleContext: string) {
  try {
    // Using AI SDK directly
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `You are an educational quiz grading assistant evaluating student answers.
      
Context about the module:
${moduleContext}

Quiz Question: ${question}
Available Options: ${options.join(", ")}
Correct Answer (according to quiz): ${correctAnswer}
Student's Answer: ${userAnswer}

Your task:
1. Determine if the student's answer is correct or partially correct
2. Rate the answer on a scale of 0-100
3. Provide helpful, educational feedback explaining why the answer is correct or incorrect
4. If the answer is partially correct, explain what part is correct and what is missing
5. If there are multiple valid interpretations or if the quiz's "correct" answer is potentially flawed, note this

Format your response as JSON:
{
  "isCorrect": boolean,
  "score": number,
  "feedback": "Detailed explanation and feedback",
  "improvement": "Suggestion for improvement if needed"
}

Your evaluation:`,
      temperature: 0.3,
      maxTokens: 500
    });

    try {
      // Parse the response as JSON
      const evaluation = JSON.parse(text);
      return { 
        success: true, 
        evaluation: {
          isCorrect: evaluation.isCorrect,
          score: evaluation.score,
          feedback: evaluation.feedback,
          improvement: evaluation.improvement
        }
      };
    } catch (error) {
      // If parsing fails, return the raw text
      console.error("Error parsing evaluation response:", error);
      return { 
        success: true, 
        evaluation: {
          isCorrect: userAnswer === correctAnswer,
          score: userAnswer === correctAnswer ? 100 : 0,
          feedback: text,
          improvement: "Try reviewing the material again."
        }
      };
    }
  } catch (error) {
    console.error("Error evaluating quiz answer:", error);
    return { 
      success: false, 
      error: "Unable to evaluate this answer. Using standard evaluation instead.",
      evaluation: {
        isCorrect: userAnswer === correctAnswer,
        score: userAnswer === correctAnswer ? 100 : 0,
        feedback: userAnswer === correctAnswer ? 
          "Correct! Good job." : 
          `Incorrect. The correct answer is: ${correctAnswer}`,
        improvement: "Review the material and try again."
      }
    };
  }
}

// Add a robust JSON cleanup function to fix common JSON issues
function cleanupJsonString(jsonString: string): string {
  try {
    // Extract JSON array if it exists
    const jsonArrayMatch = jsonString.match(/\[[\s\S]*\]/);
    if (jsonArrayMatch) {
      jsonString = jsonArrayMatch[0];
    }
    
    // Replace common JSON errors
    jsonString = jsonString
      // Fix trailing commas in arrays
      .replace(/,\s*]/g, ']')
      // Fix trailing commas in objects
      .replace(/,\s*}/g, '}')
      // Fix missing commas between array elements
      .replace(/}\s*{/g, '},{')
      // Fix missing commas between object properties
      .replace(/"\s*"/g, '","')
      // Fix unquoted property names
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
      // Fix single quotes used instead of double quotes
      .replace(/'/g, '"');
      
    // Try parsing to validate
    JSON.parse(jsonString);
    return jsonString;
  } catch (error) {
    console.error("JSON cleanup failed to fix all issues:", error);
    return jsonString; // Return original for fallback handling
  }
}

// Update the generateModules function to use a two-step prompt approach for better content extraction
async function generateModules(syllabusText: string) {
  try {
    // Extract and clean up the syllabus text
    const truncatedSyllabusText = syllabusText.slice(0, 12000); // Increased to get more content
    console.log("Processing syllabus content:", truncatedSyllabusText.length, "characters");
    console.log("First 100 characters:", truncatedSyllabusText.slice(0, 100));
    
    // Step 1: Document Analysis with detailed extraction of subject-specific information
    console.log("Step 1: Extracting syllabus subject and key information...");
    let documentAnalysis;
    try {
      const { text: analysisResult } = await generateWithRateLimit(
        `You are analyzing an educational syllabus or document to extract SPECIFIC and DETAILED information about the subject matter.
        
        Your task is to perform a THOROUGH EXTRACTION focusing EXCLUSIVELY on identifying:
        1. The EXACT subject/course being taught (e.g., Mathematics, Biology, Computer Science)
        2. ALL specific topics covered in this subject (minimum 5-10 topics)
        3. ALL concrete learning objectives from the document (minimum 3-5 objectives)
        4. ALL technical terms and key concepts that appear in the document (minimum 10-15 terms)
        5. Any assessment methods or evaluation criteria mentioned
        
        EXTREMELY IMPORTANT GUIDELINES:
        - Extract ONLY information that is CLEARLY IDENTIFIED in the document
        - Use DIRECT QUOTES from the document when possible
        - If learning objectives are missing from the document, note this fact
        - Focus on TECHNICAL and SUBJECT-SPECIFIC content, not general information
        
        SYLLABUS TEXT:
        ${truncatedSyllabusText}
        
        Provide a COMPREHENSIVE and STRUCTURED analysis with these exact sections:
        
        SUBJECT/COURSE NAME:
        [Extract the exact subject/course name]
        
        MAIN TOPICS COVERED:
        - [Topic 1]
        - [Topic 2]
        ...and so on (extract ALL topics)
        
        LEARNING OBJECTIVES:
        - [If present, extract directly; if absent, note "No explicit learning objectives found in document"]
        
        KEY TERMINOLOGY:
        - [Term 1]: [Definition from document if available]
        - [Term 2]: [Definition from document if available]
        ...and so on (extract ALL key terms with definitions when available)
        
        ASSESSMENT METHODS:
        - [Method 1]
        - [Method 2]
        ...and so on (extract ALL assessment methods)
        
        DOCUMENT CONTEXT:
        [Provide a 3-5 sentence summary of what this document appears to be about, in terms of educational content]`,
        0,
        2
      );
      
      documentAnalysis = analysisResult;
      console.log("Content analysis completed. First 100 characters:", documentAnalysis.slice(0, 100));
    } catch (analysisError) {
      console.error("Error during content extraction:", analysisError);
      // Create a simplified analysis if the first step fails
      documentAnalysis = `The document appears to be an educational syllabus covering various topics that should be organized into learning modules.`;
      console.log("Using fallback document analysis due to error");
    }
    
    // Step 2: Generate modules based on the extracted subject-specific information
    console.log("Step 2: Building modules from extracted syllabus information...");
    
    // Extract subject information from document analysis for fallback purposes
    let subject = "Educational Content";
    let topics: string[] = ["Introduction", "Core Concepts", "Applications"];
    let objectives: string[] = [];
    let keyTerms: { term: string; definition: string }[] = [];
    
    try {
      // Look for subject references in the analysis
      const subjectMatch = documentAnalysis.match(/subject\/course name:?\s*([^\.]+)\./i) || 
                           documentAnalysis.match(/course:?\s*([^\.]+)\./i) ||
                           documentAnalysis.match(/subject:?\s*([^\.]+)\./i);
      
      if (subjectMatch && subjectMatch[1]) {
        subject = subjectMatch[1].trim();
      }
      
      // Extract topics
      const topicSection = documentAnalysis.match(/(?:main )?topics covered:([^]*?)(?:learning objectives|key terminology|assessment|document context|$)/i);
      if (topicSection && topicSection[1]) {
        const topicList = topicSection[1].match(/[-•*]\s*([^\n]+)/g);
        if (topicList && topicList.length > 0) {
          topics = topicList.map(t => t.replace(/[-•*]\s*/, '').trim()).filter(t => t.length > 0);
        }
      }
      
      // Extract learning objectives
      const objectiveSection = documentAnalysis.match(/learning objectives:([^]*?)(?:key terminology|main topics|assessment|document context|$)/i);
      if (objectiveSection && objectiveSection[1]) {
        const hasNoObjectives = objectiveSection[1].toLowerCase().includes("no explicit learning objectives found");
        
        if (!hasNoObjectives) {
          const objectiveList = objectiveSection[1].match(/[-•*]\s*([^\n]+)/g);
          if (objectiveList && objectiveList.length > 0) {
            objectives = objectiveList.map(o => o.replace(/[-•*]\s*/, '').trim()).filter(o => o.length > 0);
          }
        }
      }
      
      // Extract key terms
      const termSection = documentAnalysis.match(/key terminology:([^]*?)(?:assessment|learning objectives|main topics|document context|$)/i);
      if (termSection && termSection[1]) {
        const termPattern = /[-•*]\s*([^:]+):\s*([^\n]+)/g;
        let match;
        while ((match = termPattern.exec(termSection[1])) !== null) {
          if (match[1] && match[2]) {
            keyTerms.push({
              term: match[1].trim(),
              definition: match[2].trim()
            });
          }
        }
      }
      
      console.log(`Extracted: "${subject}" with ${topics.length} topics, ${objectives.length} objectives, and ${keyTerms.length} terms`);
    } catch (extractionError) {
      console.error("Error extracting subject/topics:", extractionError);
    }
    
    // Generate learning objectives if none were found
    if (objectives.length === 0) {
      console.log("No learning objectives found, generating based on topics...");
      objectives = await generateLearningObjectives(subject, topics);
    }
    
    try {
      // Using the content analysis to generate structured modules
      const { text: moduleContent } = await generateWithRateLimit(
        `Based on this detailed syllabus analysis, create COMPREHENSIVE learning modules that thoroughly cover the exact subject identified in the syllabus.

        SYLLABUS ANALYSIS:
        ${documentAnalysis}
        
        Your task is to create 2-4 DETAILED learning modules that:
        
        1. Are PRECISELY about the subject identified in the syllabus
        2. Cover ONLY the topics explicitly mentioned in the syllabus/document
        3. Use the exact terminology found in the document
        4. Include MULTIPLE practical examples for each concept
        5. Provide COMPREHENSIVE educational content for each topic with accurate explanations
        6. Include key terms with detailed definitions that directly relate to the source document
        7. Create quiz questions with detailed explanations for each answer
        8. Include flashcards with complete definitions related to document content
        
        CRITICALLY IMPORTANT:
        - The module titles MUST clearly indicate the specific subject being taught
        - Each topic must contain substantial content directly relevant to the document
        - Write content that would be suitable for a voice tutor to explain to students
        - Technical terms MUST be from the subject area identified, not generic terms
        - Learning objectives must be specific, measurable, and based on document content
        - Quiz questions must test understanding of the actual subject matter in the document
        - For each term, include a simplified definition and a Jamaican Creole translation
        - Your response MUST be VALID JSON and nothing else

        Return ONLY a JSON array of modules with this exact structure:
        [
          {
            "title": "Subject-Specific Module Title",
            "description": "Comprehensive description about the specific subject area (at least 50 words)",
            "learningObjectives": [
              "Specific objective 1 related to the subject", 
              "Specific objective 2 related to the subject",
              "Specific objective 3 related to the subject",
              "Specific objective 4 related to the subject"
            ],
            "topics": [
              {
                "title": "Detailed Topic Title from the Subject",
                "content": "Extensive content about this topic that thoroughly explains the concepts, principles, and applications. This should include detailed explanations, examples, and connections to real-world scenarios. This content should be substantive and educational, providing a complete understanding of the topic. (at least 200 words)",
                "subtopics": ["Subtopic 1 from the subject", "Subtopic 2 from the subject", "Subtopic 3 from the subject"],
                "keyTerms": [
                  {
                    "term": "Technical term from the subject",
                    "simplifiedDefinition": "Detailed but accessible explanation of this term (30-50 words)",
                    "examples": ["Specific example 1 related to this term", "Specific example 2 related to this term"]
                  },
                  {
                    "term": "Another technical term from the subject",
                    "simplifiedDefinition": "Detailed but accessible explanation of this term (30-50 words)",
                    "examples": ["Specific example 1 related to this term", "Specific example 2 related to this term"]
                  }
                ]
              }
            ],
            "learningTools": {
              "games": [
                {
                  "title": "Subject-Specific Quiz Title",
                  "questions": [
                    {
                      "question": "Specific question about the subject matter?",
                      "options": ["Specific option A", "Specific option B", "Specific option C", "Specific option D"],
                      "correctAnswer": "Specific option A",
                      "explanation": "Detailed explanation of why this answer is correct and educational context (30-50 words)"
                    },
                    {
                      "question": "Another specific question about the subject matter?",
                      "options": ["Specific option A", "Specific option B", "Specific option C", "Specific option D"],
                      "correctAnswer": "Specific option B",
                      "explanation": "Detailed explanation of why this answer is correct and educational context (30-50 words)"
                    }
                  ]
                }
              ],
              "flashcards": [
                {
                  "term": "Subject-specific term",
                  "definition": "Comprehensive technical definition (40-60 words)",
                  "simplifiedDefinition": "Simplified but thorough explanation (30-40 words)",
                  "creoleDefinition": "Definition in Jamaican Creole"
                },
                {
                  "term": "Another subject-specific term",
                  "definition": "Comprehensive technical definition (40-60 words)",
                  "simplifiedDefinition": "Simplified but thorough explanation (30-40 words)",
                  "creoleDefinition": "Definition in Jamaican Creole"
                }
              ],
              "questionBank": [
                {
                  "question": "Specific question about a key concept in the subject?",
                  "answer": "Detailed answer that thoroughly explains the concept (50-100 words)"
                },
                {
                  "question": "Another specific question about the subject matter?",
                  "answer": "Detailed answer that thoroughly explains the concept (50-100 words)"
                }
              ]
            }
          }
        ]`,
        0, // Start with no retries
        2  // Max 2 retries
      );
      
      // Attempt to parse the JSON response
      let parsedModules;
      
      try {
        // First try direct parsing
        parsedModules = JSON.parse(moduleContent);
        console.log("Successfully parsed modules JSON directly");
      } catch (initialParseError) {
        console.log("Initial JSON parsing failed, attempting cleanup...");
        
        try {
          // Try cleaning the JSON
          const cleanedJson = cleanupJsonString(moduleContent);
          parsedModules = JSON.parse(cleanedJson);
          console.log("Successfully parsed modules JSON after cleanup");
        } catch (cleanupError) {
          console.error("JSON cleanup failed:", cleanupError);
          throw new Error("Failed to parse modules JSON: " + (initialParseError as Error).message);
        }
      }
      
      // Validate the resulting modules
      if (Array.isArray(parsedModules) && parsedModules.length > 0) {
        // Basic validation of required fields
        const validModules = parsedModules.filter(module => 
          module.title && 
          module.description && 
          Array.isArray(module.topics) && 
          module.topics.length > 0 &&
          Array.isArray(module.learningObjectives) &&
          module.learningObjectives.length > 0
        );
        
        if (validModules.length === 0) {
          console.error("No valid modules found in the generated content");
          throw new Error("Generated modules did not contain required fields");
        }
        
        console.log(`Successfully generated ${validModules.length} valid modules about: ${validModules.map(m => m.title).join(", ")}`);
        return validModules;
      } else {
        console.error("Invalid module structure - not an array or empty array");
        throw new Error("Invalid module structure - not an array or empty array");
      }
    } catch (error) {
      console.error("Failed to generate or parse modules:", error);
      
      // Create a relevant fallback module using extracted info
      console.log(`Creating fallback module for "${subject}" with ${topics.length} topics and ${keyTerms.length} terms`);
      
      // Build fallback modules based on extracted information with improved quality
      return [
        {
          title: `${subject} Fundamentals`,
          description: `A comprehensive exploration of the core concepts, principles, and applications in ${subject}. This module provides students with a solid foundation in ${subject}, covering essential topics like ${topics.slice(0,3).join(', ')}, and more. The content is designed for easy comprehension and practical application.`,
          learningObjectives: objectives.length > 0 ? 
            objectives : 
            [
              `Understand the fundamental concepts and principles in ${subject}`,
              `Apply ${subject} methodologies to solve real-world problems`,
              `Analyze ${subject} scenarios using appropriate frameworks`,
              `Develop proficiency in ${subject} terminology and methods`
            ],
          topics: topics.map((topic, index) => ({
            title: topic,
            content: `This topic provides a comprehensive explanation of ${topic} within ${subject}. ${topic} is a crucial component that helps students understand how theoretical principles apply to practical scenarios.

When studying ${topic}, you'll learn about its core principles, methodologies, and real-world applications. This knowledge builds a foundation for understanding more complex aspects of ${subject}.

The study of ${topic} includes both theoretical frameworks and practical approaches. You'll discover how professionals in the field apply these concepts to solve problems and improve outcomes. Through examples and case studies, you'll see how ${topic} functions in different contexts and situations.

Key aspects of ${topic} include analytical methods, implementation strategies, and evaluation techniques. By mastering these elements, you'll develop the skills needed to apply ${topic} principles effectively in various professional and academic settings.

Real-world examples demonstrate how ${topic} concepts are used in industry, research, and professional practice. These examples illustrate the practical value of understanding ${topic} and its relationship to other areas within ${subject}.`,
            subtopics: [
              `Fundamentals of ${topic}`, 
              `${topic} Methodologies`, 
              `Practical Applications of ${topic}`,
              `${topic} in Professional Settings`
            ],
            keyTerms: keyTerms.length > 0 ?
              keyTerms.filter((kt, i) => 
                kt.term.toLowerCase().includes(topic.toLowerCase()) || 
                i % topics.length === index % topics.length
              ).slice(0, 3).map(kt => ({
                term: kt.term,
                simplifiedDefinition: kt.definition || `A key concept in ${topic} that forms an essential part of ${subject} methodology and practice`,
                examples: [`How ${kt.term} is applied in ${topic}`, `${kt.term} in real-world ${subject} scenarios`]
              })) :
              [
                {
                  term: `${topic} Framework`,
                  simplifiedDefinition: `A structured approach to understanding and applying ${topic} within ${subject}`,
                  examples: [`Using the ${topic} framework to analyze problems`, `Applying ${topic} principles to improve outcomes`]
                },
                {
                  term: `${topic} Analysis`,
                  simplifiedDefinition: `The process of examining ${topic} elements to draw conclusions and guide decisions in ${subject}`,
                  examples: [`Analyzing ${topic} data to identify patterns`, `Conducting ${topic} analysis in professional settings`]
                }
              ]
          })),
          learningTools: {
            games: [
              {
                title: `${subject} Concept Check`,
                questions: topics.slice(0, 5).map((topic, index) => ({
                  question: `Which best describes ${topic} in the context of ${subject}?`,
                  options: [
                    `A systematic approach to understanding and applying ${topic} principles`,
                    `A theoretical concept with limited practical application`,
                    `A historical methodology rarely used in modern practice`,
                    `A specialized tool only relevant to researchers`
                  ],
                  correctAnswer: `A systematic approach to understanding and applying ${topic} principles`,
                  explanation: `${topic} is a fundamental component of ${subject} that provides a systematic framework for understanding and applying principles in practical contexts. It combines theoretical knowledge with practical methodologies that professionals use to address challenges in the field.`
                }))
              }
            ],
            flashcards: keyTerms.length > 0 ?
              keyTerms.slice(0, 10).map(kt => ({
                term: kt.term,
                definition: kt.definition || `A specialized concept in ${subject} that refers to methodologies or frameworks used to understand and address specific aspects of the field`,
                simplifiedDefinition: `An important concept in ${subject} that helps understand how to solve problems in this area`,
                creoleDefinition: `Dis a one important idea inna ${subject} weh help wi understand how fi solve problem dem inna dis area`
              })) :
              topics.slice(0, 5).map(topic => ({
                term: topic,
                definition: `A core concept in ${subject} that encompasses theoretical frameworks, analytical methods, and practical applications for addressing specific aspects of the field`,
                simplifiedDefinition: `An important area of ${subject} that helps understand and solve problems`,
                creoleDefinition: `Dis a one important part a ${subject} weh help wi understand an solve problem dem`
              })),
            questionBank: [
              {
                question: `What are the key components of ${subject}?`,
                answer: `The key components of ${subject} include: ${topics.slice(0, 5).join(', ')}, and related elements. These components form the foundation for understanding ${subject} methodology and applications in both theoretical and practical contexts. Each component contributes to the overall framework of knowledge in this field.`
              },
              {
                question: `How does ${topics[0] || 'the first topic'} contribute to understanding ${subject}?`,
                answer: `${topics[0] || 'The first topic'} is essential to understanding ${subject} because it establishes fundamental frameworks for analyzing problems and developing solutions. It provides methodological approaches, analytical tools, and conceptual models that help practitioners address complex challenges effectively. By mastering this topic, you build a foundation for more advanced concepts in the field.`
              },
              {
                question: `What practical applications does ${subject} have in professional settings?`,
                answer: `${subject} has numerous practical applications in professional settings, including problem analysis, solution development, process optimization, and outcome evaluation. Professionals use ${subject} methodologies to address challenges in ${topics.slice(0, 3).join(', ')}, applying theoretical principles to real-world scenarios to improve results and achieve specific objectives.`
              }
            ]
          }
        }
      ];
    }
  } catch (error) {
    console.error("Error in generateModules:", error);
    // Return a minimal set of modules to avoid crashing
    const fileNameSubject = syllabusText.split('\n')[1]?.match(/Title: (.+)/)?.[1] || "Educational Content";
    
    return [
      {
        title: fileNameSubject,
        description: "A comprehensive overview of key concepts, principles, and applications in this educational area.",
        learningObjectives: ["Master fundamental concepts and terminology", "Apply principles to practical scenarios", "Analyze complex problems using appropriate methodologies", "Develop expertise in key areas of the subject"],
        topics: [
          {
            title: "Introduction to the Subject",
            content: "This topic provides a foundation for understanding the core principles and applications of the subject. It covers essential concepts, historical development, and the context in which these ideas are applied. Students will gain a broad overview that prepares them for more specialized topics in later modules.\n\nThe introduction explains how different components of the subject relate to each other and how theoretical frameworks translate to practical applications. By establishing this groundwork, students can more effectively navigate the complexity of later topics and understand how individual concepts contribute to the broader discipline.",
            subtopics: ["Core Concepts", "Historical Context", "Modern Applications", "Theoretical Frameworks"],
            keyTerms: [
              {
                term: "Foundational Principles",
                simplifiedDefinition: "The essential concepts and rules that form the basis of understanding in this subject area",
                examples: ["Application of principles to basic problems", "Recognition of principles in real-world examples"]
              },
              {
                term: "Methodological Approach",
                simplifiedDefinition: "Systematic procedures and techniques used to analyze problems and develop solutions in the field",
                examples: ["Step-by-step problem solving", "Analytical frameworks for complex situations"]
              }
            ]
          },
          {
            title: "Key Methodologies and Applications",
            content: "This topic explores the practical methodologies used in the field and how they are applied to solve real-world problems. Students will learn specific techniques, analytical approaches, and implementation strategies that professionals use in various contexts.\n\nThe content covers both theoretical underpinnings of these methodologies and their practical applications, providing examples from different settings to illustrate how abstract concepts translate to concrete solutions. Through case studies and guided examples, students will develop the skills needed to select and apply appropriate methods for different scenarios.",
            subtopics: ["Analytical Techniques", "Implementation Strategies", "Case Studies", "Best Practices"],
            keyTerms: [
              {
                term: "Applied Analysis",
                simplifiedDefinition: "The process of using subject-specific tools and frameworks to examine problems and identify effective solutions",
                examples: ["Analysis of complex scenarios", "Evaluation of potential approaches"]
              }
            ]
          }
        ],
        learningTools: {
          games: [
            {
              title: "Core Concepts Assessment",
              questions: [
                {
                  question: "Which of the following best describes the relationship between theory and practice in this subject?",
                  options: [
                    "Theory provides frameworks that guide practical applications in various contexts",
                    "Theory and practice are unrelated aspects of the field",
                    "Practice is more important than theoretical understanding",
                    "Theory is only relevant in academic settings"
                  ],
                  correctAnswer: "Theory provides frameworks that guide practical applications in various contexts",
                  explanation: "The relationship between theory and practice is fundamental to this field. Theoretical frameworks provide structured approaches to understanding problems, while practical applications demonstrate how these frameworks function in real-world situations. This integration of theory and practice enables practitioners to develop effective solutions."
                }
              ]
            }
          ],
          flashcards: [
            {
              term: "Core Methodology",
              definition: "A systematic approach to analyzing problems and developing solutions, incorporating established principles and techniques specific to the field",
              simplifiedDefinition: "A structured way of approaching problems in this subject area",
              creoleDefinition: "Di proper way fi tackle problem inna dis subject area"
            },
            {
              term: "Application Framework",
              definition: "A structured system that guides the implementation of theoretical principles in practical scenarios, providing context for decision-making",
              simplifiedDefinition: "A system that helps put theories into practice",
              creoleDefinition: "Di system weh help wi use theory inna real life"
            }
          ],
          questionBank: [
            {
              question: "How do theoretical frameworks contribute to practical problem-solving in this field?",
              answer: "Theoretical frameworks provide structured approaches to understanding problems, identifying relevant factors, and developing systematic solutions. They help practitioners analyze complex situations by breaking them down into manageable components, determining relationships between elements, and applying established principles to develop effective interventions or strategies."
            }
          ]
        }
      }
    ];
  }
}

// Update the generateWithRateLimit function to use gpt-4o for more detailed outputs
async function generateWithRateLimit(prompt: string, retryCount = 0, maxRetries = 1) {
  try {
    // Use gpt-4o for higher quality content generation, especially for detailed educational content
    const model = "gpt-4o";
    console.log(`Using model ${model} for generation`);
    
    return await generateText({
      model: openai(model),
      prompt: prompt,
      temperature: 0.3,
      maxTokens: 3500, // Increased token limit for more detailed content
    });
  } catch (error: any) {
    // Check if it's a rate limit error
    if (error.message?.includes("rate limit") || error.code === "rate_limit_exceeded") {
      if (retryCount < maxRetries) {
        // Calculate exponential backoff delay: 2^retry * 1000ms + random jitter
        const delayMs = (Math.pow(2, retryCount) * 1000) + (Math.random() * 1000);
        console.log(`Rate limit hit. Retrying in ${Math.round(delayMs/1000)} seconds...`);
        
        // Wait for the backoff period
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        // Retry with incremented retry count
        return generateWithRateLimit(prompt, retryCount + 1, maxRetries);
      } else {
        // Fall back to gpt-3.5-turbo if we hit limits with gpt-4o
        console.log("Max retries exceeded. Falling back to gpt-3.5-turbo.");
        return await generateText({
          model: openai("gpt-3.5-turbo"),
          prompt: prompt,
          temperature: 0.3,
          maxTokens: 2500,
        });
      }
    } else {
      // Re-throw non-rate-limit errors
      throw error;
    }
  }
}

export async function deleteModule(index: number) {
  try {
    // Ensure we're using the latest global state
    generatedModules = global.generatedModules;
    
    // Validate the index
    if (index < 0 || index >= generatedModules.length) {
      return { success: false, error: "Invalid module index" };
    }

    // Remove the module from the array
    generatedModules.splice(index, 1);
    
    // Update global state
    global.generatedModules = generatedModules;
    
    // Revalidate the path to update the UI
    revalidatePath('/modules');
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting module:", error);
    return { success: false, error: "Failed to delete module" };
  }
}

// Add a new helper function to generate learning objectives based on subject and topics
async function generateLearningObjectives(subject: string, topics: string[]): Promise<string[]> {
  try {
    console.log(`Generating learning objectives for ${subject} with ${topics.length} topics`);
    
    // Default objectives in case generation fails
    const defaultObjectives = [
      `Understand the fundamental concepts and principles in ${subject}`,
      `Apply ${subject} methodologies to solve real-world problems`,
      `Analyze ${subject} scenarios using appropriate frameworks`,
      `Develop proficiency in ${subject} terminology and methods`
    ];
    
    if (topics.length === 0) {
      return defaultObjectives;
    }
    
    // Generate contextually relevant learning objectives
    try {
      const { text: objectivesText } = await generateWithRateLimit(
        `Based on this subject "${subject}" and these topics:
        ${topics.slice(0, 10).join(', ')}
        
        Generate 4-6 specific, measurable learning objectives that:
        1. Use action verbs (understand, analyze, evaluate, create, apply, etc.)
        2. Focus on specific knowledge and skills students should gain
        3. Relate directly to the subject and topics
        4. Progress from basic understanding to more complex skills
        5. Are achievable and measurable
        
        Format your response as a simple list with each objective on a new line starting with a dash:
        - Learning objective 1
        - Learning objective 2
        - etc.`,
        0,
        1
      );
      
      // Extract learning objectives from the response
      const objectivesList = objectivesText.match(/[-•*]\s*([^\n]+)/g);
      if (objectivesList && objectivesList.length > 0) {
        const extractedObjectives = objectivesList.map(o => 
          o.replace(/[-•*]\s*/, '').trim()
        ).filter(o => o.length > 0);
        
        if (extractedObjectives.length >= 3) {
          return extractedObjectives;
        }
      }
    } catch (error) {
      console.error("Error generating learning objectives:", error);
    }
    
    // Fall back to default objectives if generation fails
    return defaultObjectives;
  } catch (error) {
    console.error("Error in generateLearningObjectives:", error);
    return [
      `Understand the fundamental concepts and principles in ${subject}`,
      `Apply ${subject} methodologies to solve real-world problems`,
      `Analyze ${subject} scenarios using appropriate frameworks`,
      `Develop proficiency in ${subject} terminology and methods`
    ];
  }
}
