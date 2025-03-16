# CaribAI Learning Platform

A modern educational platform that transforms syllabi into engaging learning modules with Jamaican Creole explanations. The platform includes an AI assistant, interactive code editor, and personalized learning tools.

## Features

- **AI-Powered Module Generation**: Upload syllabi and transform them into structured learning modules
- **Learning Lab**: Interactive coding environment with a built-in Monaco Editor
- **AI Assistant**: Get answers to questions using OpenAI's GPT models
- **Programming Modules**: Learn various programming languages with structured content
- **AI Learning Modules**: Learn AI concepts from basic to advanced levels
- **Jamaican Creole Integration**: Explanations with cultural context for better understanding

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Editor**: Monaco Editor (VS Code's editor)
- **AI Integration**: OpenAI API
- **Authentication**: Firebase Authentication
- **Styling**: Tailwind CSS with custom theming

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/javainerobinson/carib-ai.git
   cd carib-ai
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   FIREBASE_APP_ID=your_firebase_app_id
   ```

4. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Modules

### AI Learning Modules
- AI Fundamentals (Beginner)
- Machine Learning (Intermediate)
- Deep Learning (Advanced)

### Programming Modules
- Python Basics (Beginner)
- JavaScript Essentials (Beginner)
- Java Fundamentals (Intermediate)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the GPT API
- Monaco Editor team for the excellent code editor
- Next.js team for the React framework
