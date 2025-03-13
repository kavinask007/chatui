import { auth } from "@/app/(auth)/auth";
import {
  createModel,
  assignModelToGroup,
  removeModel,
  removeModelFromGroup,
  getUserAvailableModels,
} from "@/lib/db/queries";
import { modelConfig, groupModelAccess, modelProvider } from "@/lib/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(request: Request) {
  const session :any = await auth();

  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      case "listProviders": {
        const providers = await db
          .select({
            id: modelProvider.id,
            name: modelProvider.name,
            baseUrl: modelProvider.baseUrl,
            description: modelProvider.description,
            createdAt: modelProvider.createdAt,
            configuration: modelProvider.configuration,
          })
          .from(modelProvider);

        return Response.json({ providers });
      }

      case "listModels": {
        const models = await db
          .select({
            id: modelConfig.id,
            name: modelConfig.name,
            providerId: modelConfig.providerId,
            modelId: modelConfig.modelId,
            description: modelConfig.description,
            createdAt: modelConfig.createdAt,
          })
          .from(modelConfig);

        const modelGroups = await db
          .select({
            modelId: groupModelAccess.modelConfigId,
            groupId: groupModelAccess.groupId,
          })
          .from(groupModelAccess);

        const modelsWithGroups = models.map((m) => ({
          ...m,
          groups: modelGroups
            .filter((mg) => mg.modelId === m.id)
            .map((mg) => mg.groupId),
        }));

        return Response.json({ models: modelsWithGroups });
      }

      case "getUserModels": {
        try {
          const models = await getUserAvailableModels(session.user.id);
          return Response.json({ models });
        } catch (error) {
          console.error("Failed to get user models:", error);
          return Response.json({ models: [] });
        }
      }

      case "createModel": {
        const { name, providerId, modelId, description } = body;
        if (!name || !providerId || !modelId) {
          return Response.json(
            { error: "Name, provider ID and model ID are required" },
            { status: 400 }
          );
        }

        await createModel({
          name,
          providerId,
          modelId,
          description,
        });
        return Response.json({ message: "Model created successfully" });
      }

      case "updateModel": {
        const { id, name, description, modelId } = body;
        if (!id) {
          return Response.json(
            { error: "Model ID is required" },
            { status: 400 }
          );
        }

        await db
          .update(modelConfig)
          .set({
            name: name,
            description: description,
            modelId: modelId,
          })
          .where(eq(modelConfig.id, id));

        return Response.json({ message: "Model updated successfully" });
      }

      case "assignModelToGroup": {
        const { modelId, groupId } = body;
        if (!modelId || !groupId) {
          return Response.json(
            { error: "Model ID and Group ID are required" },
            { status: 400 }
          );
        }

        await assignModelToGroup({ modelId, groupId });
        return Response.json({ message: "Model assigned to group" });
      }

      case "removeModelFromGroup": {
        const { modelId, groupId } = body;
        if (!modelId || !groupId) {
          return Response.json(
            { error: "Model ID and Group ID are required" },
            { status: 400 }
          );
        }

        await removeModelFromGroup({ modelId, groupId });
        return Response.json({ message: "Model removed from group" });
      }

      case "removeModel": {
        const { modelId } = body;
        if (!modelId) {
          return Response.json(
            { error: "Model ID is required" },
            { status: 400 }
          );
        }

        await removeModel(modelId);
        return Response.json({ message: "Model removed successfully" });
      }

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in model settings API:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
