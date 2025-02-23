import { auth } from "@/app/(auth)/auth";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tool, groupToolAccess } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUserAvailableTools } from "@/lib/db/queries";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(request: Request) {
  const session: any = await auth();

  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      case "listTools": {
        const tools = await db
          .select({
            id: tool.id,
            name: tool.name,
            description: tool.description,
            configuration: tool.configuration,
            createdAt: tool.createdAt,
          })
          .from(tool);

        const toolGroups = await db
          .select({
            toolId: groupToolAccess.toolId,
            groupId: groupToolAccess.groupId,
          })
          .from(groupToolAccess);

        const toolsWithGroups = tools.map((t) => ({
          ...t,
          groups: toolGroups
            .filter((tg) => tg.toolId === t.id)
            .map((tg) => tg.groupId),
        }));

        return Response.json({ tools: toolsWithGroups });
      }

      case "listUserTools": {
        if (!session?.user?.id) {
          return Response.json(
            { error: "User ID is required" },
            { status: 400 }
          );
        }

        const userTools = await getUserAvailableTools(session.user.id);
        return Response.json({ tools: userTools });
      }

      case "createTool": {
        const { name, description, configuration } = body;
        if (!name) {
          return Response.json(
            { error: "Tool name is required" },
            { status: 400 }
          );
        }

        const newTool = await db.insert(tool).values({
          name,
          description,
          configuration: configuration || {},
        }).returning();

        return Response.json({ 
          message: "Tool created successfully",
          tool: newTool[0]
        });
      }

      case "updateToolConfig": {
        const { toolId, configuration } = body;
        if (!toolId || !configuration) {
          return Response.json(
            { error: "Tool ID and configuration are required" },
            { status: 400 }
          );
        }

        await db
          .update(tool)
          .set({ configuration })
          .where(eq(tool.id, toolId));

        return Response.json({ message: "Tool configuration updated successfully" });
      }

      case "assignToolToGroup": {
        const { toolId, groupId } = body;
        if (!toolId || !groupId) {
          return Response.json(
            { error: "Tool ID and Group ID are required" },
            { status: 400 }
          );
        }

        await db.insert(groupToolAccess).values({
          toolId,
          groupId,
        });

        return Response.json({ message: "Tool assigned to group" });
      }

      case "removeToolFromGroup": {
        const { toolId, groupId } = body;
        if (!toolId || !groupId) {
          return Response.json(
            { error: "Tool ID and Group ID are required" },
            { status: 400 }
          );
        }

        await db
          .delete(groupToolAccess)
          .where(
            eq(groupToolAccess.toolId, toolId) &&
            eq(groupToolAccess.groupId, groupId)
          );

        return Response.json({ message: "Tool removed from group" });
      }

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in tool settings API:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
