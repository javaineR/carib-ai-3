// This must be a server component to generate static paths
// We'll split the functionality into a client component later

import { Metadata } from 'next';
import { ModuleConversationClient } from './client';

export const dynamic = 'force-static';

// Generate static paths for dynamic route
export async function generateStaticParams() {
  return [
    { moduleId: 'ai-basics' },
    { moduleId: 'prompt-engineering' },
    { moduleId: 'module-1' },
    { moduleId: 'module-2' },
    { moduleId: 'module-3' }
  ];
}

export const metadata: Metadata = {
  title: 'Module Conversation | QuantumEd AI',
  description: 'Have a conversation with your AI tutor about module content'
};

// Server component that renders the client component
export default function ModuleConversationPage({ params }: { params: { moduleId: string } }) {
  return <ModuleConversationClient moduleId={params.moduleId} />;
} 