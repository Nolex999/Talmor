import { NextResponse } from 'next/server';

// Invite consumption now happens atomically inside the auth.users signup
// trigger. Keep this endpoint only so older clients receive an explicit,
// side-effect-free response instead of calling the retired insecure flow.
export async function POST() {
  return NextResponse.json(
    { error: 'Invite consumption is handled automatically during signup.' },
    { status: 410 }
  );
}
