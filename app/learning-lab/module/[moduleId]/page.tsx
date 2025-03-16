import { Metadata } from 'next';
import { ModuleClient } from './client';

export const dynamic = 'force-static';

// Generate static paths for the dynamic route
export async function generateStaticParams() {
  return [
    { moduleId: 'ai-basics' },
    { moduleId: 'prompt-engineering' },
    { moduleId: 'python-basics' },
    { moduleId: 'classical-mechanics' },
    { moduleId: 'module-1' },
    { moduleId: 'module-2' },
    { moduleId: 'module-3' }
  ];
}

export const metadata: Metadata = {
  title: 'Learning Lab Module | QuantumEd AI',
  description: 'Interactive learning modules with lessons, quizzes, and AI-powered features'
};

// Server component that renders the client component
export default function ModulePage({ params }: { params: { moduleId: string } }) {
  return <ModuleClient moduleId={params.moduleId} />;
} 