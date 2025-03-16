"use client"

import React, { useState, useEffect } from 'react';
import { apriori } from '../lib/apriori-algorithm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MessageSquare, Lightbulb, ArrowRight } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Module, Topic, KeyTerm, Flashcard } from '../types/module';

// Define a type for pattern with support
type PatternWithSupport = {
  pattern: string[];
  support: number;
  percentage: number;
};

// Props interface for ChatAnalytics
interface ChatAnalyticsProps {
  chatData?: string[][];
  modules?: Module[];
  onSuggestModules?: (patterns: PatternWithSupport[]) => void;
}

const ChatAnalytics: React.FC<ChatAnalyticsProps> = ({ 
  chatData = [], 
  modules = [],
  onSuggestModules 
}) => {
  // Default chat data if none provided
  const defaultChatData: string[][] = [
    ["energy", "kinetic", "mechanics"],
    ["potential", "energy", "work"],
    ["energy", "kinetic", "motion"],
    ["forces", "mechanics", "energy"],
    ["work", "energy", "potential"],
  ];

  const [userChatData, setUserChatData] = useState<string[][]>(chatData.length > 0 ? chatData : defaultChatData);
  const [frequentPatterns, setFrequentPatterns] = useState<PatternWithSupport[]>([]);
  const [minSupport, setMinSupport] = useState<number>(2);
  const [activeTab, setActiveTab] = useState("patterns");
  const [suggestedModules, setSuggestedModules] = useState<Module[]>([]);
  const router = useRouter();

  // Analyze chat data
  const handleAnalyze = () => {
    // Ensure we have data to analyze
    if (userChatData.length === 0) return;

    // Run Apriori algorithm
    const patterns = apriori(userChatData, minSupport);
    
    // Calculate support and percentage for each pattern
    const patternsWithSupport = patterns.map((pattern: string[]) => {
      let supportCount = 0;
      userChatData.forEach(transaction => {
        if (pattern.every(item => transaction.includes(item))) {
          supportCount++;
        }
      });
      
      return {
        pattern,
        support: supportCount,
        percentage: Math.round((supportCount / userChatData.length) * 100)
      };
    });

    // Sort by support (highest first)
    const sortedPatterns = patternsWithSupport.sort((a: PatternWithSupport, b: PatternWithSupport) => b.support - a.support);
    
    setFrequentPatterns(sortedPatterns);
    
    // Match patterns to modules
    findRelevantModules(sortedPatterns);
    
    // Call callback if provided
    if (onSuggestModules) {
      onSuggestModules(sortedPatterns);
    }
  };

  // Find modules that match the discovered patterns
  const findRelevantModules = (patterns: PatternWithSupport[]) => {
    if (!modules || modules.length === 0) return;

    // Create a scoring system for modules
    const moduleScores: {[key: number]: number} = {};
    
    // For each module
    modules.forEach((module, index) => {
      moduleScores[index] = 0;
      
      // Get all text content from the module
      const moduleContent = [
        module.title,
        module.description,
        ...(module.learningObjectives || []),
        ...module.topics.map((t: Topic) => t.title),
        ...module.topics.map((t: Topic) => t.content),
        ...module.topics.flatMap((t: Topic) => t.subtopics || []),
        ...module.topics.flatMap((t: Topic) => (t.keyTerms || []).map((kt: KeyTerm) => kt.term)),
        ...module.learningTools.flashcards.map((f: Flashcard) => f.term),
      ].join(" ").toLowerCase();
      
      // Check each pattern against module content
      patterns.forEach(({ pattern, support }) => {
        const patternMatchCount = pattern.filter(item => 
          moduleContent.includes(item.toLowerCase())
        ).length;
        
        // Score based on match percentage and pattern support
        if (patternMatchCount > 0) {
          const matchPercentage = patternMatchCount / pattern.length;
          moduleScores[index] += matchPercentage * support;
        }
      });
    });
    
    // Sort modules by score and take top 5
    const topModuleIndices = Object.entries(moduleScores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .slice(0, 5)
      .map(([index]) => parseInt(index));
    
    const recommended = topModuleIndices.map(index => modules[index]);
    setSuggestedModules(recommended);
  };

  // Start conversation about a specific module
  const startConversation = (moduleIndex: number) => {
    // Navigate to conversation page with selected module
    router.push(`/conversations?module=${moduleIndex}`);
  };

  useEffect(() => {
    // Analyze chat data when component mounts or chat data changes
    if (chatData.length > 0 && chatData !== userChatData) {
      setUserChatData(chatData);
    }
  }, [chatData]);

  // Prepare chart data
  const chartData = frequentPatterns
    .filter(p => p.pattern.length <= 3) // Limit to simpler patterns for visualization
    .slice(0, 10) // Top 10
    .map(p => ({
      name: p.pattern.join(", "),
      support: p.support,
      percentage: p.percentage
    }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Learning Pattern Analysis
          </CardTitle>
          <CardDescription>
            Analyze chat data to discover frequent learning topics and patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span>Minimum support:</span>
              <select 
                value={minSupport} 
                onChange={(e) => setMinSupport(parseInt(e.target.value))}
                className="border rounded p-1"
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>{num} occurrences</option>
                ))}
              </select>
              
              <Button onClick={handleAnalyze} className="ml-auto">
                Analyze {chatData.length > 0 ? 'Conversation' : 'Sample'} Data
              </Button>
            </div>
            
            {frequentPatterns.length > 0 && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList>
                  <TabsTrigger value="patterns">Frequent Patterns</TabsTrigger>
                  <TabsTrigger value="visualization">Visualization</TabsTrigger>
                  <TabsTrigger value="modules">Suggested Modules</TabsTrigger>
                </TabsList>
                
                <TabsContent value="patterns" className="space-y-4">
                  <div className="grid gap-2">
                    {frequentPatterns.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <span className="font-medium">{item.pattern.join(", ")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="ml-2">
                            Support: {item.support}
                          </Badge>
                          <Badge variant="secondary" className="ml-2">
                            {item.percentage}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="visualization">
                  <div className="h-80 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="support" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                
                <TabsContent value="modules" className="space-y-4">
                  {suggestedModules.length > 0 ? (
                    <div className="grid gap-4">
                      {suggestedModules.map((module, index) => (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                          <CardContent className="py-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-lg">{module.title}</h3>
                                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                                  {module.description}
                                </p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => startConversation(modules.findIndex(m => m.title === module.title))}
                                className="flex items-center gap-1"
                              >
                                <Lightbulb className="h-4 w-4" />
                                <span>Discuss</span>
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">
                      No modules match the discovered patterns.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatAnalytics; 