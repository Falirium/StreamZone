import { NextRequest, NextResponse } from 'next/server';

// Server-side in-memory cache to track preview usage by IP + Event Slug
// Key format: `${ip}_${slug}`
// Value: consumed seconds (number)
const previewCache = new Map<string, number>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || 'global';
  
  // Resolve client IP safely
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1';
             
  const cacheKey = `${ip}_${slug}`;
  const consumed = previewCache.get(cacheKey) || 0;
  const remaining = Math.max(0, 300 - consumed);
  
  return NextResponse.json({ remaining });
}

export async function POST(request: NextRequest) {
  try {
    const { slug, seconds } = await request.json();
    const eventSlug = slug || 'global';
    const ticks = seconds || 5; // default 5 seconds heartbeat
    
    // Resolve client IP safely
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';
               
    const cacheKey = `${ip}_${eventSlug}`;
    const currentConsumed = previewCache.get(cacheKey) || 0;
    const newConsumed = Math.min(300, currentConsumed + ticks);
    previewCache.set(cacheKey, newConsumed);
    
    const remaining = Math.max(0, 300 - newConsumed);
    return NextResponse.json({ remaining });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
