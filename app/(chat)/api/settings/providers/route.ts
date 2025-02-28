import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { modelProvider } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { providerSettings } from "@/lib/ai";

// Get supported providers from provider settings
const SUPPORTED_PROVIDERS = Object.keys(providerSettings);
type SupportedProvider = typeof SUPPORTED_PROVIDERS[number];

export async function POST(request: Request) {
  const session: any = await auth();

  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      case "listProviders": {
        const providers = await db
          .select()
          .from(modelProvider);
        return Response.json({ providers });
      }

      case "getProviderTypes": {
        // Return provider settings schema
        return Response.json({ 
          providers: Object.entries(providerSettings).map(([name, settings]) => ({
            name,
            settings
          }))
        });
      }

      case "createProvider": {
        const { name, description, configuration } = body;
        const baseUrl:string=''
        if (!name) {
          return Response.json(
            { error: "Provider name is required" },
            { status: 400 }
          );
        }

        // Validate provider type matches supported providers
        if (!SUPPORTED_PROVIDERS.includes(name as SupportedProvider)) {
          return Response.json(
            { error: "Invalid provider type" },
            { status: 400 }
          );
        }
        
        // Insert new provider
        await db.insert(modelProvider).values({
          name,
          baseUrl ,
          description,
          configuration: configuration || {},
          createdAt: new Date()
        });

        return Response.json({ message: "Provider created successfully" });
      }

      case "updateProvider": {
        const { id, description, configuration } = body;
        const baseUrl:string=''
        if (!id) {
          return Response.json(
            { error: "Provider ID is required" },
            { status: 400 }
          );
        }

        await db
          .update(modelProvider)
          .set({
            baseUrl,
            description,
            configuration: configuration || {}
          })
          .where(eq(modelProvider.id, id));

        return Response.json({ message: "Provider updated successfully" });
      }

      case "deleteProvider": {
        const { id } = body;

        if (!id) {
          return Response.json(
            { error: "Provider ID is required" },
            { status: 400 }
          );
        }

        await db
          .delete(modelProvider)
          .where(eq(modelProvider.id, id));

        return Response.json({ message: "Provider deleted successfully" });
      }

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in provider settings API:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
