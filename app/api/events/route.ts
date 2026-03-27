import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const EVENTS_PATH = path.join(process.cwd(), 'config', 'events.json');

export async function GET() {
  const data = fs.readFileSync(EVENTS_PATH, 'utf-8');
  return NextResponse.json(JSON.parse(data));
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
  fs.writeFileSync(EVENTS_PATH, JSON.stringify(body, null, 2), 'utf-8');
  return NextResponse.json({ ok: true });
}
