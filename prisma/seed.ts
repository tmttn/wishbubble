import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Database connection string not found");
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper to create slug
function createSlug(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, "-")}-${nanoid(6)}`;
}

// Fake users data
const fakeUsers = [
  { email: "emma.johnson@example.com", name: "Emma Johnson" },
  { email: "lucas.vandenberg@example.com", name: "Lucas van den Berg" },
  { email: "sophie.dubois@example.com", name: "Sophie Dubois" },
  { email: "max.mueller@example.com", name: "Max Müller" },
  { email: "olivia.smith@example.com", name: "Olivia Smith" },
  { email: "noah.de.vries@example.com", name: "Noah de Vries" },
  { email: "mia.martinez@example.com", name: "Mia Martinez" },
  { email: "liam.brown@example.com", name: "Liam Brown" },
  { email: "anna.kowalski@example.com", name: "Anna Kowalski" },
  { email: "james.wilson@example.com", name: "James Wilson" },
];

// Wishlist items templates
const wishlistItems = {
  tech: [
    { title: "Apple AirPods Pro 2", price: 279, priority: "MUST_HAVE" as const, category: "Electronics", imageUrl: "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/MQD83?wid=1144&hei=1144" },
    { title: "Kindle Paperwhite", price: 149, priority: "NICE_TO_HAVE" as const, category: "Electronics", imageUrl: "https://m.media-amazon.com/images/I/61PHWbXNh3L._AC_SX679_.jpg" },
    { title: "Logitech MX Master 3S", price: 99, priority: "NICE_TO_HAVE" as const, category: "Electronics", imageUrl: "https://resource.logitech.com/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-mouse-top-view-graphite.png" },
    { title: "Sony WH-1000XM5", price: 379, priority: "DREAM" as const, category: "Electronics", imageUrl: "https://m.media-amazon.com/images/I/61vJtKbassL._AC_SX679_.jpg" },
    { title: "Raspberry Pi 5", price: 85, priority: "NICE_TO_HAVE" as const, category: "Electronics" },
  ],
  home: [
    { title: "Philips Hue Starter Kit", price: 149, priority: "NICE_TO_HAVE" as const, category: "Smart Home", imageUrl: "https://www.assets.signify.com/is/image/PhilipsLighting/046677563158-?"  },
    { title: "Dyson V15 Detect", price: 749, priority: "DREAM" as const, category: "Home Appliances" },
    { title: "Le Creuset Dutch Oven", price: 350, priority: "MUST_HAVE" as const, category: "Kitchen", imageUrl: "https://www.lecreuset.com/dw/image/v2/BFKN_PRD/on/demandware.static/-/Sites-lecreuset-master/default/dwa0a9e8a0/images/large/LS2501-2867.jpg" },
    { title: "Nespresso Vertuo Plus", price: 199, priority: "NICE_TO_HAVE" as const, category: "Kitchen" },
    { title: "Weighted Blanket", price: 89, priority: "NICE_TO_HAVE" as const, category: "Bedroom" },
  ],
  fashion: [
    { title: "Nike Air Max 90", price: 140, priority: "MUST_HAVE" as const, category: "Shoes" },
    { title: "Ray-Ban Wayfarer", price: 170, priority: "NICE_TO_HAVE" as const, category: "Accessories" },
    { title: "Patagonia Better Sweater", price: 139, priority: "NICE_TO_HAVE" as const, category: "Clothing" },
    { title: "Casio G-Shock Watch", price: 99, priority: "NICE_TO_HAVE" as const, category: "Accessories" },
    { title: "North Face Jacket", price: 250, priority: "DREAM" as const, category: "Clothing" },
  ],
  books: [
    { title: "Atomic Habits - James Clear", price: 20, priority: "MUST_HAVE" as const, category: "Books" },
    { title: "The Pragmatic Programmer", price: 55, priority: "NICE_TO_HAVE" as const, category: "Books" },
    { title: "Dune Complete Collection", price: 75, priority: "NICE_TO_HAVE" as const, category: "Books" },
    { title: "Clean Code - Robert Martin", price: 45, priority: "NICE_TO_HAVE" as const, category: "Books" },
  ],
  games: [
    { title: "Nintendo Switch OLED", price: 349, priority: "DREAM" as const, category: "Gaming" },
    { title: "The Legend of Zelda: Tears of the Kingdom", price: 60, priority: "MUST_HAVE" as const, category: "Gaming" },
    { title: "PlayStation DualSense Controller", price: 69, priority: "NICE_TO_HAVE" as const, category: "Gaming" },
    { title: "Catan Board Game", price: 45, priority: "NICE_TO_HAVE" as const, category: "Board Games" },
  ],
  sports: [
    { title: "Yoga Mat Premium", price: 45, priority: "MUST_HAVE" as const, category: "Fitness" },
    { title: "Resistance Bands Set", price: 25, priority: "NICE_TO_HAVE" as const, category: "Fitness" },
    { title: "Garmin Forerunner 255", price: 349, priority: "DREAM" as const, category: "Fitness" },
    { title: "Tennis Racket Wilson", price: 180, priority: "NICE_TO_HAVE" as const, category: "Sports" },
  ],
};

async function main() {
  console.log("🌱 Starting seed...\n");

  // Find or create the main user
  let mainUser = await prisma.user.findUnique({
    where: { email: "thomas.metten@gmail.com" },
  });

  if (!mainUser) {
    console.log("Creating main user: thomas.metten@gmail.com");
    mainUser = await prisma.user.create({
      data: {
        email: "thomas.metten@gmail.com",
        name: "Thomas Metten",
        emailVerified: new Date(),
        subscriptionTier: "PREMIUM",
      },
    });
  } else {
    console.log("Found existing user: thomas.metten@gmail.com");
  }

  // Create fake users
  console.log("\n👥 Creating fake users...");
  const createdUsers = [];
  const hashedPassword = await bcrypt.hash("testpassword123", 10);

  for (const userData of fakeUsers) {
    let user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          ...userData,
          emailVerified: new Date(),
          passwordHash: hashedPassword,
        },
      });
      console.log(`  ✓ Created user: ${userData.name}`);
    } else {
      console.log(`  ○ User exists: ${userData.name}`);
    }
    createdUsers.push(user);
  }

  // Create wishlists for all users (including main user)
  console.log("\n📝 Creating wishlists...");
  const allUsers = [mainUser, ...createdUsers];
  const itemCategories = Object.keys(wishlistItems) as (keyof typeof wishlistItems)[];

  for (const user of allUsers) {
    // Check if user already has a default wishlist
    let defaultWishlist = await prisma.wishlist.findFirst({
      where: { userId: user.id, isDefault: true },
    });

    if (!defaultWishlist) {
      defaultWishlist = await prisma.wishlist.create({
        data: {
          userId: user.id,
          name: "My Wishlist",
          isDefault: true,
          description: `${user.name}'s wishlist for upcoming occasions`,
        },
      });
      console.log(`  ✓ Created default wishlist for ${user.name}`);
    }

    // Add items if wishlist is empty
    const existingItems = await prisma.wishlistItem.count({
      where: { wishlistId: defaultWishlist.id },
    });

    if (existingItems === 0) {
      // Pick 2-3 random categories and add items
      const shuffledCategories = itemCategories.sort(() => Math.random() - 0.5);
      const selectedCategories = shuffledCategories.slice(0, 2 + Math.floor(Math.random() * 2));

      let sortOrder = 0;
      for (const category of selectedCategories) {
        const items = wishlistItems[category];
        const numItems = 2 + Math.floor(Math.random() * 3); // 2-4 items per category
        const selectedItems = items.sort(() => Math.random() - 0.5).slice(0, numItems);

        for (const item of selectedItems) {
          await prisma.wishlistItem.create({
            data: {
              wishlistId: defaultWishlist.id,
              title: item.title,
              price: item.price,
              currency: "EUR",
              priority: item.priority,
              category: item.category,
              imageUrl: item.imageUrl,
              sortOrder: sortOrder++,
              quantity: 1,
            },
          });
        }
      }
      console.log(`    → Added ${sortOrder} items to ${user.name}'s wishlist`);
    }
  }

  // Create bubbles owned by the main user
  console.log("\n🫧 Creating bubbles...");

  const bubblesToCreate = [
    {
      name: "Family Christmas 2025",
      description: "Our annual family Secret Santa exchange! Let's make this Christmas special with thoughtful gifts.",
      occasionType: "CHRISTMAS" as const,
      eventDate: new Date("2025-12-25"),
      budgetMin: 25,
      budgetMax: 50,
      isSecretSanta: true,
      maxMembers: 12,
      themeColor: "#dc2626",
    },
    {
      name: "Office Gift Exchange",
      description: "Annual office gift exchange. Keep it fun and appropriate!",
      occasionType: "CHRISTMAS" as const,
      eventDate: new Date("2025-12-20"),
      budgetMin: 15,
      budgetMax: 30,
      isSecretSanta: true,
      maxMembers: 20,
      themeColor: "#16a34a",
    },
    {
      name: "Sophie's 30th Birthday",
      description: "Help us celebrate Sophie's milestone birthday! No surprises, she knows about this 😄",
      occasionType: "BIRTHDAY" as const,
      eventDate: new Date("2025-03-15"),
      budgetMin: 20,
      budgetMax: 100,
      isSecretSanta: false,
      maxMembers: 15,
      themeColor: "#9333ea",
    },
    {
      name: "Sinterklaas 2025",
      description: "Sinterklaas surprise exchange! Don't forget to write a funny poem with your gift.",
      occasionType: "SINTERKLAAS" as const,
      eventDate: new Date("2025-12-05"),
      budgetMin: 10,
      budgetMax: 25,
      isSecretSanta: true,
      maxMembers: 10,
      themeColor: "#ea580c",
    },
    {
      name: "Emma & Liam's Wedding",
      description: "Wedding registry for our special day. Thank you for celebrating with us!",
      occasionType: "WEDDING" as const,
      eventDate: new Date("2025-06-21"),
      budgetMin: null,
      budgetMax: null,
      isSecretSanta: false,
      maxMembers: 50,
      themeColor: "#ec4899",
    },
  ];

  const createdBubbles = [];
  for (const bubbleData of bubblesToCreate) {
    // Check if bubble already exists by name
    const existingBubble = await prisma.bubble.findFirst({
      where: {
        ownerId: mainUser.id,
        name: bubbleData.name,
      },
    });

    if (!existingBubble) {
      const bubble = await prisma.bubble.create({
        data: {
          ...bubbleData,
          slug: createSlug(bubbleData.name),
          ownerId: mainUser.id,
          currency: "EUR",
        },
      });

      // Add owner as member
      await prisma.bubbleMember.create({
        data: {
          bubbleId: bubble.id,
          userId: mainUser.id,
          role: "OWNER",
        },
      });

      createdBubbles.push(bubble);
      console.log(`  ✓ Created bubble: ${bubbleData.name}`);
    } else {
      createdBubbles.push(existingBubble);
      console.log(`  ○ Bubble exists: ${bubbleData.name}`);
    }
  }

  // Add members to bubbles
  console.log("\n👥 Adding members to bubbles...");

  for (let i = 0; i < createdBubbles.length; i++) {
    const bubble = createdBubbles[i];
    // Add different subsets of users to each bubble
    const membersToAdd = createdUsers.slice(0, 3 + (i % 5)); // 3-7 members per bubble

    for (const user of membersToAdd) {
      const existingMembership = await prisma.bubbleMember.findUnique({
        where: {
          bubbleId_userId: {
            bubbleId: bubble.id,
            userId: user.id,
          },
        },
      });

      if (!existingMembership) {
        await prisma.bubbleMember.create({
          data: {
            bubbleId: bubble.id,
            userId: user.id,
            role: "MEMBER",
          },
        });
      }
    }
    console.log(`  ✓ Added ${membersToAdd.length} members to "${bubble.name}"`);
  }

  // Attach wishlists to bubbles
  console.log("\n🔗 Attaching wishlists to bubbles...");

  for (const bubble of createdBubbles) {
    const members = await prisma.bubbleMember.findMany({
      where: { bubbleId: bubble.id },
      include: { user: { include: { wishlists: true } } },
    });

    for (const member of members) {
      const defaultWishlist = member.user.wishlists.find(w => w.isDefault);
      if (defaultWishlist) {
        const existingAttachment = await prisma.bubbleWishlist.findUnique({
          where: {
            bubbleId_wishlistId: {
              bubbleId: bubble.id,
              wishlistId: defaultWishlist.id,
            },
          },
        });

        if (!existingAttachment) {
          await prisma.bubbleWishlist.create({
            data: {
              bubbleId: bubble.id,
              wishlistId: defaultWishlist.id,
            },
          });
        }
      }
    }
    console.log(`  ✓ Attached wishlists to "${bubble.name}"`);
  }

  // Create some claims (simulating gift coordination)
  console.log("\n🎁 Creating claims...");

  for (const bubble of createdBubbles) {
    const members = await prisma.bubbleMember.findMany({
      where: { bubbleId: bubble.id },
      include: {
        user: {
          include: {
            wishlists: {
              include: {
                items: { where: { deletedAt: null } }
              }
            }
          }
        }
      },
    });

    // Each member claims some items from other members' wishlists
    for (const claimer of members) {
      for (const itemOwner of members) {
        // Don't claim your own items
        if (claimer.userId === itemOwner.userId) continue;

        const wishlist = itemOwner.user.wishlists.find(w => w.isDefault);
        if (!wishlist || wishlist.items.length === 0) continue;

        // Randomly claim 0-2 items
        const numToClaim = Math.floor(Math.random() * 3);
        const shuffledItems = wishlist.items.sort(() => Math.random() - 0.5);
        const itemsToClaim = shuffledItems.slice(0, numToClaim);

        for (const item of itemsToClaim) {
          // Check if already claimed
          const existingClaim = await prisma.claim.findFirst({
            where: {
              itemId: item.id,
              bubbleId: bubble.id,
              userId: claimer.userId,
            },
          });

          if (!existingClaim) {
            const status = Math.random() > 0.7 ? "PURCHASED" : "CLAIMED";
            await prisma.claim.create({
              data: {
                itemId: item.id,
                userId: claimer.userId,
                bubbleId: bubble.id,
                status: status as "CLAIMED" | "PURCHASED",
                quantity: 1,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                purchasedAt: status === "PURCHASED" ? new Date() : null,
              },
            });
          }
        }
      }
    }
    console.log(`  ✓ Created claims in "${bubble.name}"`);
  }

  // Create activity feed entries
  console.log("\n📋 Creating activities...");

  for (const bubble of createdBubbles) {
    const members = await prisma.bubbleMember.findMany({
      where: { bubbleId: bubble.id },
    });

    // Add some member joined activities
    for (const member of members.slice(1)) { // Skip owner
      const existingActivity = await prisma.activity.findFirst({
        where: {
          bubbleId: bubble.id,
          userId: member.userId,
          type: "MEMBER_JOINED",
        },
      });

      if (!existingActivity) {
        await prisma.activity.create({
          data: {
            bubbleId: bubble.id,
            userId: member.userId,
            type: "MEMBER_JOINED",
            metadata: {},
          },
        });
      }
    }
    console.log(`  ✓ Created activities for "${bubble.name}"`);
  }

  // Create some notifications for the main user
  console.log("\n🔔 Creating notifications...");

  const notificationsToCreate = [
    {
      type: "MEMBER_JOINED" as const,
      title: "New member joined!",
      body: "Emma Johnson joined Family Christmas 2025",
    },
    {
      type: "WISHLIST_ADDED" as const,
      title: "Wishlist added",
      body: "Lucas van den Berg added their wishlist to Office Gift Exchange",
    },
    {
      type: "EVENT_APPROACHING" as const,
      title: "Event reminder",
      body: "Sinterklaas 2025 is coming up in 2 weeks!",
    },
    {
      type: "SYSTEM" as const,
      title: "Welcome to WishBubble!",
      body: "Start by creating a bubble and inviting your friends and family.",
    },
  ];

  for (const notif of notificationsToCreate) {
    await prisma.notification.create({
      data: {
        userId: mainUser.id,
        ...notif,
        bubbleId: createdBubbles[0]?.id,
      },
    });
  }
  console.log(`  ✓ Created ${notificationsToCreate.length} notifications`);

  // Create pending invitations
  console.log("\n✉️ Creating invitations...");

  const invitesToCreate = [
    { email: "pending.user@example.com", bubble: createdBubbles[0] },
    { email: "waiting.response@example.com", bubble: createdBubbles[1] },
  ];

  for (const invite of invitesToCreate) {
    if (!invite.bubble) continue;

    const existingInvite = await prisma.invitation.findFirst({
      where: {
        email: invite.email,
        bubbleId: invite.bubble.id,
      },
    });

    if (!existingInvite) {
      await prisma.invitation.create({
        data: {
          email: invite.email,
          bubbleId: invite.bubble.id,
          invitedBy: mainUser.id,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
      console.log(`  ✓ Created invitation for ${invite.email}`);
    }
  }

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   • Main user: thomas.metten@gmail.com`);
  console.log(`   • Fake users: ${fakeUsers.length}`);
  console.log(`   • Bubbles: ${createdBubbles.length}`);
  console.log(`   • Wishlists created for all users`);
  console.log(`   • Claims, activities, and notifications generated`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
