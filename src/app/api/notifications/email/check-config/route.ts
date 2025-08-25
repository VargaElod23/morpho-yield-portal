import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET() {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const hasApiKey = !!apiKey;
    
    if (!hasApiKey) {
      return NextResponse.json({
        configured: false,
        message: 'RESEND_API_KEY environment variable is not set'
      });
    }
    
    // Test the API key by checking if we can initialize Resend
    const resend = new Resend(apiKey);
    
    return NextResponse.json({
      configured: true,
      message: 'Resend API key is configured',
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 8) + '...'
    });
    
  } catch (error) {
    console.error('Error checking Resend configuration:', error);
    return NextResponse.json({
      configured: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}