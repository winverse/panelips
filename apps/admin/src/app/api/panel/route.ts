import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const response = await fetch(`${backendUrl}/panel`);

    if (!response.ok) {
      return new NextResponse(`Backend returned status: ${response.status}`, {
        status: response.status,
      });
    }

    const html = await response.text();
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error rendering tRPC panel:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
