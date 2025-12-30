import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createBubbleSchema } from "@/lib/validators/bubble";
import { nanoid } from "nanoid";

// GET /api/bubbles - Get user's bubbles
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bubbles = await prisma.bubbleMember.findMany({
      where: {
        userId: session.user.id,
        leftAt: null,
      },
      include: {
        bubble: {
          include: {
            owner: {
              select: { id: true, name: true, avatarUrl: true },
            },
            members: {
              where: { leftAt: null },
              include: {
                user: {
                  select: { id: true, name: true, avatarUrl: true },
                },
              },
            },
            _count: {
              select: { members: true, wishlists: true },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    return NextResponse.json(bubbles.map((m: { bubble: unknown }) => m.bubble));
  } catch (error) {
    console.error("Error fetching bubbles:", error);
    return NextResponse.json(
      { error: "Failed to fetch bubbles" },
      { status: 500 }
    );
  }
}

// POST /api/bubbles - Create a new bubble
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createBubbleSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { name, description, occasionType, eventDate, budgetMin, budgetMax, currency, isSecretSanta, maxMembers } =
      validatedData.data;

    // Generate unique slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${nanoid(6)}`;

    // Create bubble with owner as member
    const bubble = await prisma.bubble.create({
      data: {
        name,
        description,
        slug,
        occasionType,
        eventDate,
        budgetMin,
        budgetMax,
        currency,
        isSecretSanta,
        maxMembers,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return NextResponse.json(bubble, { status: 201 });
  } catch (error) {
    console.error("Error creating bubble:", error);
    return NextResponse.json(
      { error: "Failed to create bubble" },
      { status: 500 }
    );
  }
}
