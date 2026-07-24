import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // Delete the secure session cookie
  cookieStore.delete('admin_session');

  return NextResponse.json({ success: true });
}
