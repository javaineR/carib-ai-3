import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env file
});

// Function to generate text using GPT
export async function generateText(prompt: string, options = {}) {
  try {
    // Use a cheaper model (gpt-3.5-turbo instead of gpt-4)
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Cheaper and faster than gpt-4
      messages: [
        { role: "system", content: "You are an educational assistant that helps simplify complex topics." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500, // Limit response length to reduce costs
      ...options
    });

    return {
      success: true,
      text: response.choices[0].message.content,
      usage: response.usage
    };
  } catch (error: any) {
    console.error("Error generating text:", error);
    return {
      success: false,
      error: error.message || "Failed to generate text",
    };
  }
}

// Function to analyze syllabus
export async function analyzeSyllabus(syllabusText: string) {
  try {
    // Use a cheaper model (gpt-3.5-turbo instead of gpt-4)
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Cheaper and faster than gpt-4
      messages: [
        { 
          role: "system", 
          content: "You are an educational expert that analyzes syllabi and extracts key topics and learning objectives." 
        },
        { 
          role: "user", 
          content: `Analyze the following syllabus and identify the main topics that need to be taught. Format your response as a JSON array of topic names only.\n\n${syllabusText}` 
        }
      ],
      temperature: 0.3,
      max_tokens: 300, // Limit response length to reduce costs
      response_format: { type: "json_object" } // Ensure the response is in JSON format
    });

    return {
      success: true,
      analysis: JSON.parse(response.choices[0].message.content || "{}"),
      usage: response.usage
    };
  } catch (error: any) {
    console.error("Error analyzing syllabus:", error);
    return {
      success: false,
      error: error.message || "Failed to analyze syllabus",
    };
  }
}