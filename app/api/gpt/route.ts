import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '../../../lib/gpt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const result = await generateText(prompt);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GPT API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 