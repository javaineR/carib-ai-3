import { NextRequest, NextResponse } from 'next/server';
import { generateJamaicanVoice } from '@/app/actions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, useJamaicanVoice = true, voiceType = 'teacher' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    // Pass the voiceType parameter to select the appropriate voice
    const result = await generateJamaicanVoice(text, voiceType);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in generate-voice API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate voice.' },
      { status: 500 }
    );
  }
} 