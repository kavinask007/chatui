import "dotenv/config";
import { db } from "../lib/db";
import { user, verifiedUsers } from "../lib/db/schema";
import { eq } from "drizzle-orm";

interface SetupUserOptions {
  email: string;
  isAdmin?: boolean;
}

export async function addVerifiedUser({
  email,
  isAdmin = false,
}: SetupUserOptions) {
  // Check if email already exists in verified users
  const existingUser = await db
    .select()
    .from(verifiedUsers)
    .where(eq(verifiedUsers.email, email.toLowerCase()))
    .limit(1);

  if (existingUser.length > 0) {
    console.log(`User ${email} already exists in verified users`);
    // Still update admin status if needed
    if (isAdmin) {
      const res = await db
        .update(user)
        .set({ isAdmin: true })
        .where(eq(user.email, email.toLowerCase()));
      console.log(
        res.length > 0
          ? `Updated ${email} to admin status`
          : "Making user admin failed potentially user hasnot created account yet"
      );
    }

    return;
  }

  // Add to verified users table if email doesn't exist
  await db
    .insert(verifiedUsers)
    .values({
      email: email.toLowerCase(),
    })
    .onConflictDoNothing();

  // If user exists and isAdmin is true, update admin status
  if (isAdmin) {
    const res = await db
      .update(user)
      .set({ isAdmin: true })
      .where(eq(user.email, email.toLowerCase()));
    console.log(
      res.length > 0
        ? `Updated ${email} to admin status`
        : "Making user admin failed potentially user hasnot created account yet"
    );
  }

  console.log(
    `✅ Added ${email} to verified users${isAdmin ? " as admin" : ""}`
  );
}

export async function setupInitialUsers() {
  const users: SetupUserOptions[] = [
    // Add your initial verified users here
    // { email: 'admin@example.com', isAdmin: true },
    // { email: 'user@example.com' },
  ];

  for (const userData of users) {
    await addVerifiedUser(userData);
  }
}

function printUsage() {
  console.log(`
Usage:
  pnpm users:add <email>           Add a verified user
  pnpm users:add-admin <email>     Add a verified user as admin
  pnpm users:setup                 Run initial setup (add users from configuration)

Examples:
  pnpm users:add user@example.com
  pnpm users:add-admin admin@example.com
  pnpm users:setup
`);
}

// Allow running directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    process.exit(0);
  }

  if (args[0] === "--setup") {
    setupInitialUsers()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
      });
  } else {
    const isAdmin = args.includes("--admin");
    const email = isAdmin ? args[1] : args[0];
    console.log(args);
    if (!email) {
      console.error("Please provide an email address");
      printUsage();
      process.exit(1);
    }

    addVerifiedUser({ email, isAdmin })
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
      });
  }
}
