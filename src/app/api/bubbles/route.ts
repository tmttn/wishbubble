import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createBubbleSchema } from "@/lib/validators/bubble";
import { nanoid } from "nanoid";
import { handleApiError, Errors } from "@/lib/api-error";

// GET /api/bubbles - Get user's bubbles
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw Errors.unauthorized();
    }

    const bubbles = await prisma.bubbleMember.findMany({
      where: {
        userId: session.user.id,
        leftAt: null,
        bubble: {
          archivedAt: null,
        },
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
    return handleApiError(error, "GET /api/bubbles");
  }
}

// POST /api/bubbles - Create a new bubble
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw Errors.unauthorized();
    }

    const body = await request.json();
    const validatedData = createBubbleSchema.parse(body); // Throws ZodError if invalid

    const {
      name,
      description,
      occasionType,
      eventDate,
      budgetMin,
      budgetMax,
      currency,
      isSecretSanta,
      maxMembers,
      allowMemberWishlists,
    } = validatedData;

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
        allowMemberWishlists,
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

    // Create activity log for group creation
    await prisma.activity.create({
      data: {
        bubbleId: bubble.id,
        userId: session.user.id,
        type: "GROUP_CREATED",
        metadata: {
          groupName: name,
          occasionType,
          userName: session.user.name,
        },
      },
    });

    return NextResponse.json(bubble, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/bubbles");
  }
}
