# Memoralk — Orders Management System & Growth Analytics

Memoralk is an executive order management and growth analytics portal built with Next.js App Router, Clerk Authentication, Drizzle ORM, and safe server actions.

## Features
- **Executive Dashboard**: Monthly revenue, cost of goods sold (COGS), profit margins, and growth trajectory.
- **Order Queue & Fulfillment**: Real-time status workflow audits (`pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`).
- **Automated Client PDF Invoices**: Instant PDF invoice generation.
- **Relational PostgreSQL Database**: Powered by Drizzle ORM with transactions and auto-seeding.
- **Strict Safe Server Actions**: Production-grade action client ensuring responses return strictly plain objects.
- **Authentication**: Powered by Clerk with protected routes and proxy middleware.

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Configure environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   DATABASE_URL=postgres://postgres:password@localhost:5432/memoralk_orders
   ```

3. Database commands:
   ```bash
   pnpm run db:push     # Push schema to PostgreSQL
   pnpm run db:generate # Generate migrations
   pnpm run db:studio   # Open Drizzle Studio
   ```

4. Run the development server:
   ```bash
   pnpm run dev
   ```
