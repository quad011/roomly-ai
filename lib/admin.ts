import { clerkClient } from "@clerk/nextjs/server";

export async function isAdmin(userId: string) {
  const adminEmail = process.env.ADMIN_EMAIL
    ?.trim()
    .toLowerCase();

  if (!adminEmail) {
    return false;
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  return user.emailAddresses.some(
    (email) =>
      email.emailAddress.trim().toLowerCase() ===
      adminEmail
  );
}