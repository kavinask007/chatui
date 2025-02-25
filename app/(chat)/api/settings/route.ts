import { auth } from "@/app/(auth)/auth";
import {
  addUserToGroup,
  createUserGroup,
  removeUserFromGroup,
} from "@/lib/db/queries";
import { verifiedUsers, user, group, userGroup } from "@/lib/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(request: Request) {
  const session:any = await auth();

  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      case "addToInviteList": {
        const { email } = body;
        if (!email) {
          return Response.json({ error: "Email is required" }, { status: 400 });
        }

        await db.insert(verifiedUsers).values({ email });
        return Response.json({ message: "User added to invite list" });
      }

      case "listInvitedUsers": {
        const invitedUsers = await db
          .select({
            email: verifiedUsers.email,
          })
          .from(verifiedUsers);
        return Response.json({ invitedUsers });
      }

      case "createGroup": {
        const { name, description } = body;
        if (!name) {
          return Response.json(
            { error: "Group name is required" },
            { status: 400 }
          );
        }

        await createUserGroup({ name, description });
        return Response.json({ message: "Group created successfully" });
      }

      case "removeGroup": {
        const { groupId } = body;
        if (!groupId) {
          return Response.json(
            { error: "Group ID is required" },
            { status: 400 }
          );
        }

        await db.delete(group).where(eq(group.id, groupId));
        return Response.json({ message: "Group removed successfully" });
      }

      case "addUserToGroup": {
        const { userId, groupId, role } = body;
        if (!userId || !groupId) {
          return Response.json(
            { error: "User ID and Group ID are required" },
            { status: 400 }
          );
        }

        await addUserToGroup({ userId, groupId, role });
        return Response.json({ message: "User added to group" });
      }

      case "removeUserFromGroup": {
        const { userId, groupId } = body;
        if (!userId || !groupId) {
          return Response.json(
            { error: "User ID and Group ID are required" },
            { status: 400 }
          );
        }

        await removeUserFromGroup({ userId, groupId });
        return Response.json({ message: "User removed from group" });
      }

      case "listUsers": {
        const users = await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            image: user.image,
          })
          .from(user);

        const userGroups = await db
          .select({
            userId: userGroup.userId,
            groupId: userGroup.groupId,
          })
          .from(userGroup);

        const usersWithGroups = users.map(u => ({
          ...u,
          groups: userGroups
            .filter(ug => ug.userId === u.id)
            .map(ug => ug.groupId)
        }));

        return Response.json({ users: usersWithGroups });
      }

      case "listGroups": {
        const groups = await db
          .select({
            id: group.id,
            name: group.name,
            description: group.description,
            createdAt: group.createdAt,
          })
          .from(group);
        return Response.json({ groups });
      }

      case "listGroupUsers": {
        const { groupId } = body;
        if (!groupId) {
          return Response.json(
            { error: "Group ID is required" },
            { status: 400 }
          );
        }

        const groupUsers = await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            image: user.image,
            role: userGroup.role,
          })
          .from(user)
          .innerJoin(userGroup, eq(user.id, userGroup.userId))
          .where(eq(userGroup.groupId, groupId));
        return Response.json({ users: groupUsers });
      }

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in settings API:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
