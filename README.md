# QuantumEd Learning Platform

QuantumEd is an AI-powered educational platform that transforms syllabus content into engaging, interactive learning modules with Jamaican Creole localization.

## Features

### Syllabus Analysis and Module Creation

The platform analyzes syllabus text and intelligently breaks it down into smaller, digestible modules:

- **Topic Extraction**: Identifies main topics and subtopics from syllabus content
- **Content Summarization**: Provides brief summaries of key concepts
- **Module Organization**: Structures learning content into logical progressions

### Interactive Learning Tools

Each generated module comes with the following interactive features:

#### Games & Quizzes
- Interactive quizzes based on module content
- Multiple-choice questions with immediate feedback
- Score tracking and performance assessment

#### Flashcards
- Term-definition pairs for key concepts
- Bilingual support with English and Jamaican Creole translations
- Interactive flip functionality for self-testing

#### Q&A System
- AI-powered question answering about module content
- Frequently asked questions section that grows over time
- Contextual answers based on module content

### Localization Features

- **Jamaican Creole Translations**: Key terms and concepts are translated to Jamaican Creole
- **Cultural Context**: Explanations are adapted to be more relevant to Jamaican students
- **Translation API**: Ability to translate any term on demand

## Getting Started

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Start the development server
npm run dev
```

### Usage Guide

1. **Upload a Syllabus**:
   - Navigate to the "Create Modules" page
   - Upload a PDF or DOCX syllabus file
   - Wait for AI processing to complete

2. **Explore Generated Modules**:
   - View the modules on the "Modules" tab
   - Browse through topics and subtopics
   - Use the interactive learning tools

3. **Use Learning Tools**:
   - Practice with quizzes in the Games section
   - Study using the flashcards with Jamaican Creole translations
   - Ask questions in the Q&A section

4. **Export Content**:
   - Download modules as JSON for data portability
   - Generate PDF versions for offline studying

## Technical Architecture

- **Next.js**: React framework for the frontend and API routes
- **OpenAI API**: Powers the AI syllabus analysis and content generation
- **Shadcn UI**: Component library for the user interface
- **Vercel AI SDK**: Simplifies AI integrations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all educators and students who provided feedback
- Special thanks to the Jamaican language experts who helped with translations
