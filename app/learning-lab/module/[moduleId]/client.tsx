"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ModuleClient({ moduleId }: { moduleId: string }) {
  const [message, setMessage] = useState("Hello from learning lab module");
  
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Learning Lab Module: {moduleId}</h1>
      <p>{message}</p>
      <Button onClick={() => setMessage("Learning module updated")}>Update</Button>
    </div>
  );
} 