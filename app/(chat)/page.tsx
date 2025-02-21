import { cookies } from "next/headers";

import { Chat } from "@/components/chat";
import { generateUUID } from "@/lib/utils";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { auth } from "@/app/(auth)/auth";
import { getUserAvailableModels } from "@/lib/db/queries";

export default async function Page() {
  const id = generateUUID();
  const session :any = await auth();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("model-id")?.value;

  // Get available models directly from database
  const models = await getUserAvailableModels(session?.user?.id || "");
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    (models.length > 0 ? models[0].id : "");

  return (
    <>
      <Chat
        key={id}
        id={id}
        availablemodels={models}
        initialMessages={[]}
        selectedModelId={selectedModelId}
        selectedVisibilityType="private"
        isReadonly={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
