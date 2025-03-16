import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { HeadphonesIcon } from 'lucide-react';

type Module = {
  title: string;
  description: string;
  learningObjectives?: string[];
  topics: Array<{
    title: string;
    content: string;
    subtopics: string[];
    keyTerms?: Array<{
      term: string;
      simplifiedDefinition: string;
      examples?: string[];
    }>;
  }>;
};

interface ModuleVoiceConversationProps {
  module: Module;
  moduleIndex: number;
}

export function ModuleVoiceConversation({ module, moduleIndex }: ModuleVoiceConversationProps) {
  const router = useRouter();

  const handleOpenConversation = () => {
    // Store module data in sessionStorage to access it on the conversation page
    sessionStorage.setItem('selectedModule', JSON.stringify(module));
    router.push(`/module-conversation/${moduleIndex}`);
  };

  return (
    <Button 
      onClick={handleOpenConversation}
      variant="outline"
      className="flex items-center gap-2 mt-4"
    >
      <HeadphonesIcon className="h-4 w-4" />
      <span>Jamaican Voice Tutor</span>
    </Button>
  );
} 