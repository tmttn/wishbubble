# WishBubble

A group-first wishlist platform for Secret Santa events and gift exchanges.

## Features

- **Group-First Approach**: Create "bubbles" (groups) before wishlists - perfect for coordinating gift exchanges
- **Privacy-Aware Claims**: Wishlist owners never see what's been claimed, but other participants do
- **Secret Santa Draw**: Built-in random name assignment with exclusion rules
- **Reusable Wishlists**: Share the same wishlist across multiple bubbles
- **Email Invitations**: Invite participants via email with one-click join

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Auth.js)
- **Styling**: Tailwind CSS + shadcn/ui
- **Email**: Resend
- **State Management**: React Query + Zustand

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/wishbubble.git
   cd wishbubble
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/wishbubble"
   NEXTAUTH_SECRET="your-secret-key"
   AUTH_SECRET="your-secret-key"
   ```

5. Push the database schema:
   ```bash
   npx prisma db push
   ```

6. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

7. Run the development server:
   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main app pages
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── bubbles/           # Bubble-related components
│   ├── wishlist/          # Wishlist components
│   └── layout/            # Layout components
├── lib/
│   ├── auth/              # Authentication config
│   ├── db/                # Prisma client
│   ├── email/             # Email templates
│   └── validators/        # Zod schemas
└── types/                 # TypeScript types
```

## Key Concepts

### Bubbles
A "bubble" is a group created for a specific gift exchange event. Members can:
- Share their wishlists
- View others' wishlists
- Claim items to prevent duplicates
- Participate in Secret Santa draws

### Claims
The claim system is the core feature:
- When you claim an item, it's marked for other bubble members
- The wishlist owner **never** sees claim status
- Claims can be marked as purchased or unclaimed

### Privacy Model
- Wishlist owners see their items but NOT claim status
- Other bubble members see items WITH claim status
- This is enforced at the API level with separate endpoints

## Development

### Database Commands

```bash
# Push schema changes
npx prisma db push

# Generate client after schema changes
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Create migration
npx prisma migrate dev --name your_migration_name
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| NEXTAUTH_URL | Application URL | Yes |
| NEXTAUTH_SECRET | JWT secret | Yes |
| AUTH_SECRET | Auth.js secret | Yes |
| GOOGLE_CLIENT_ID | Google OAuth client ID | No |
| GOOGLE_CLIENT_SECRET | Google OAuth secret | No |
| RESEND_API_KEY | Resend API key for emails | No |
| FROM_EMAIL | Sender email address | No |

## License

MIT License
