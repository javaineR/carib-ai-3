"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ModuleConversationClient({ moduleId }: { moduleId: string }) {
  const [message, setMessage] = useState("Hello from client component");
  
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Module Conversation: {moduleId}</h1>
      <p>{message}</p>
      <Button onClick={() => setMessage("Message updated")}>Update</Button>
    </div>
  );
} 