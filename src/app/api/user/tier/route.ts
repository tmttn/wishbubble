import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserTier } from "@/lib/plans";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getUserTier(session.user.id);

    return NextResponse.json({ tier });
  } catch (error) {
    console.error("Error fetching user tier:", error);
    return NextResponse.json(
      { error: "Failed to fetch user tier" },
      { status: 500 }
    );
  }
}
