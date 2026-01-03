import { NextResponse } from "next/server";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push";

// GET /api/push/vapid-key - Get public VAPID key for client subscription
export async function GET() {
  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push notifications not configured" },
      { status: 503 }
    );
  }

  const publicKey = getVapidPublicKey();

  return NextResponse.json({ publicKey });
}
