import {
  type Message,
  convertToCoreMessages,
  createDataStreamResponse,
  streamObject,
} from "ai";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { customModel } from "@/lib/ai";
import {
  codePrompt,
  systemPrompt,
  updateDocumentPrompt,
} from "@/lib/ai/prompts";
import {
  deleteChatById,
  getChatById,
  getDocumentById,
  saveChat,
  saveDocument,
  saveMessages,
  saveSuggestions,
  getUserAvailableModelsWithConfig,
  getUserAvailableTools,
} from "@/lib/db/queries";
import type { Suggestion } from "@/lib/db/schema";
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from "@/lib/utils";
import { smoothStream, streamText } from "ai";
import { experimental_generateImage as generateImage } from "ai";
import { generateTitleFromUserMessage } from "../../actions";
import { createToolSet } from "@/lib/ai/mcp";

export const maxDuration = 60;

type AllowedTools =
  | "createDocument"
  | "updateDocument"
  | "requestSuggestions"
  | "getWeather";

const blocksTools: AllowedTools[] = [
  "createDocument",
  "updateDocument",
  "requestSuggestions",
];

const weatherTools: AllowedTools[] = ["getWeather"];

const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];

export async function POST(request: Request) {
  const requestData = await request.json();
  console.log(requestData);
  const {
    id,
    messages,
    modelId,
    tools_selected,
  }: {
    id: string;
    messages: Array<Message>;
    modelId: string;
    tools_selected: string[] | undefined;
  } = requestData;
  const session: any = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get available models from database
  const models = await getUserAvailableModelsWithConfig(session.user.id);
  const model = models.find((model) => model.id === modelId);
  if (!model) {
    return new Response("Model not found", { status: 404 });
  }
  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response("No user message found", { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  const userMessageId = generateUUID();

  await saveMessages({
    messages: [
      { ...userMessage, id: userMessageId, createdAt: new Date(), chatId: id },
    ],
  });

  // Get available tools and their configurations
  const availableTools = await getUserAvailableTools(session.user.id);
  console.log(tools_selected);
  const selectedToolConfigurations = availableTools
    .filter((tool) => tools_selected?.includes(tool.id))
    .reduce((acc, tool) => {
      acc[tool.name] = tool.configuration;
      return acc;
    }, {} as Record<string, any>);

  const toolSet = await createToolSet({
    mcpServers: selectedToolConfigurations,
  });
  console.log(toolSet);
  return createDataStreamResponse({
    execute: (dataStream) => {
      dataStream.writeData({
        type: "user-message-id",
        content: userMessageId,
      });

      const result = streamText({
        model: customModel(model),
        system: systemPrompt,
        messages: coreMessages,
        maxSteps: 10,
        experimental_transform: smoothStream(),
        tools: toolSet?.tools,
        onFinish: async ({ response }) => {
          if (session.user?.id) {
            try {
              const responseMessagesWithoutIncompleteToolCalls =
                sanitizeResponseMessages(response.messages);

              await saveMessages({
                messages: responseMessagesWithoutIncompleteToolCalls.map(
                  (message) => {
                    const messageId = generateUUID();

                    if (message.role === "assistant") {
                      dataStream.writeMessageAnnotation({
                        messageIdFromServer: messageId,
                      });
                    }

                    return {
                      id: messageId,
                      chatId: id,
                      role: message.role,
                      content: message.content,
                      createdAt: new Date(),
                    };
                  }
                ),
              });
            } catch (error) {
              console.error("Failed to save chat");
            }
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: "stream-text",
        },
      });

      result.mergeIntoDataStream(dataStream,{sendReasoning:true});
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session: any = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
