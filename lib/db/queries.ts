import "server-only";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { and, asc, desc, eq, gt, gte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
  verifiedUsers,
  modelConfig,
  group,
  userGroup,
  groupModelAccess,
  modelProvider,
  modelConfigCredential,
  modelConfigSetting,
} from "./schema";
import { BlockKind } from "@/components/block";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error("Failed to get user from database");
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error("Failed to create user in database");
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error("Failed to save chat in database");
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error("Failed to get chats by user from database");
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error("Failed to get chat by id from database");
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error("Failed to save messages in database", error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error("Failed to get messages by chat id from database", error);
    throw error;
  }
}

export async function isVerfied(email: string) {
  try {
    const isAllowedToSignIn = await db
      .select({ email: verifiedUsers.email })
      .from(verifiedUsers)
      .where(eq(verifiedUsers.email, email || ""))
      .limit(1) // Limit the query to a single match
      .then((results) => results.length > 0);
    return isAllowedToSignIn;
  } catch (error) {
    console.error("Failed to get messages by chat id from database", error);
    return 0;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (error) {
    console.error("Failed to upvote message in database", error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error("Failed to get votes by chat id from database", error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to save document in database");
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error("Failed to get document by id from database");
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error("Failed to get document by id from database");
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      "Failed to delete documents by id after timestamp from database"
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error("Failed to save suggestions in database");
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      "Failed to get suggestions by document version from database"
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error("Failed to get message by id from database");
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await db
      .delete(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );
  } catch (error) {
    console.error(
      "Failed to delete messages by id after timestamp from database"
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error("Failed to update chat visibility in database");
    throw error;
  }
}

// New functions for user groups and model access

export async function getUserAvailableModels(userId: string) {
  try {
    // First check if user is admin
    const [userRecord] = await db
      .select({ isAdmin: user.isAdmin })
      .from(user)
      .where(eq(user.id, userId));

    // If user is admin, return all models
    if (userRecord?.isAdmin) {
      return await db
        .select({
          id: modelConfig.id,
          name: modelConfig.name,
          providerId: modelConfig.providerId,
          modelId: modelConfig.modelId,
          description: modelConfig.description,
          provider: {
            name: modelProvider.name,
            baseUrl: modelProvider.baseUrl,
            configuration: modelProvider.configuration,
          },
        })
        .from(modelConfig)
        .innerJoin(modelProvider, eq(modelConfig.providerId, modelProvider.id));
    }

    // Otherwise, get models based on user's groups
    const userGroups = await db
      .select({
        groupId: userGroup.groupId,
      })
      .from(userGroup)
      .where(eq(userGroup.userId, userId));

    const groupIds = userGroups.map((g) => g.groupId);

    if (groupIds.length === 0) {
      return [];
    }

    // Get model configs available to user's groups
    return await db
      .select({
        id: modelConfig.id,
        name: modelConfig.name,
        providerId: modelConfig.providerId,
        modelId: modelConfig.modelId,
        description: modelConfig.description,
        provider: {
          name: modelProvider.name,
          configuration: modelProvider.configuration,
        },
      })
      .from(modelConfig)
      .innerJoin(modelProvider, eq(modelConfig.providerId, modelProvider.id))
      .innerJoin(
        groupModelAccess,
        eq(groupModelAccess.modelConfigId, modelConfig.id)
      )
      .where(inArray(groupModelAccess.groupId, groupIds));
  } catch (error) {
    console.error("Failed to get user's available models", error);
    throw error;
  }
}

export async function getUserAvailableModelsWithConfig(userId: string) {
  try {
    // First check if user is admin
    const [userRecord] = await db
      .select({ isAdmin: user.isAdmin })
      .from(user)
      .where(eq(user.id, userId));

    // If user is admin, return all models with their configurations
    if (userRecord?.isAdmin) {
      return await db
        .select({
          id: modelConfig.id,
          name: modelConfig.name,
          providerId: modelConfig.providerId,
          modelId: modelConfig.modelId,
          description: modelConfig.description,
          provider: {
            name: modelProvider.name,
            baseUrl: modelProvider.baseUrl,
            configuration: modelProvider.configuration,
          },
          credentials: modelConfigCredential,
          settings: modelConfigSetting,
        })
        .from(modelConfig)
        .innerJoin(modelProvider, eq(modelConfig.providerId, modelProvider.id))
        .leftJoin(
          modelConfigCredential,
          eq(modelConfigCredential.modelConfigId, modelConfig.id)
        )
        .leftJoin(
          modelConfigSetting,
          eq(modelConfigSetting.modelConfigId, modelConfig.id)
        );
    }

    // Otherwise, get models based on user's groups
    const userGroups = await db
      .select({
        groupId: userGroup.groupId,
      })
      .from(userGroup)
      .where(eq(userGroup.userId, userId));

    const groupIds = userGroups.map((g) => g.groupId);

    if (groupIds.length === 0) {
      return [];
    }

    // Get model configs available to user's groups with their configurations
    return await db
      .select({
        id: modelConfig.id,
        name: modelConfig.name,
        providerId: modelConfig.providerId,
        modelId: modelConfig.modelId,
        description: modelConfig.description,
        provider: {
          name: modelProvider.name,
          baseUrl: modelProvider.baseUrl,
          configuration: modelProvider.configuration,
        },
        credentials: modelConfigCredential,
        settings: modelConfigSetting,
      })
      .from(modelConfig)
      .innerJoin(modelProvider, eq(modelConfig.providerId, modelProvider.id))
      .innerJoin(
        groupModelAccess,
        eq(groupModelAccess.modelConfigId, modelConfig.id)
      )
      .leftJoin(
        modelConfigCredential,
        eq(modelConfigCredential.modelConfigId, modelConfig.id)
      )
      .leftJoin(
        modelConfigSetting,
        eq(modelConfigSetting.modelConfigId, modelConfig.id)
      )
      .where(inArray(groupModelAccess.groupId, groupIds));
  } catch (error) {
    console.error("Failed to get user's available models with config", error);
    throw error;
  }
}

export async function createUserGroup({
  name,
  description,
}: {
  name: string;
  description?: string;
}) {
  try {
    return await db.insert(group).values({
      name,
      description,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to create user group", error);
    throw error;
  }
}

export async function addUserToGroup({
  userId,
  groupId,
  role = "member",
}: {
  userId: string;
  groupId: string;
  role?: "member" | "admin";
}) {
  try {
    return await db.insert(userGroup).values({
      userId,
      groupId,
      role,
    });
  } catch (error) {
    console.error("Failed to add user to group", error);
    throw error;
  }
}

export async function removeUserFromGroup({
  userId,
  groupId,
}: {
  userId: string;
  groupId: string;
}) {
  try {
    return await db
      .delete(userGroup)
      .where(and(eq(userGroup.userId, userId), eq(userGroup.groupId, groupId)));
  } catch (error) {
    console.error("Failed to remove user from group", error);
    throw error;
  }
}

type ModelCredentialKey =
  | "apiKey"
  | "accessKeyId"
  | "secretAccessKey"
  | "region"
  | "projectId"
  | "serviceAccountKey";

export async function createModel({
  name,
  providerId,
  modelId,
  description,
  credentials,
}: {
  name: string;
  providerId: string;
  modelId: string;
  description?: string;
  credentials?: Array<{ key: ModelCredentialKey; value: string }>;
}) {
  try {
    const [result] = await db
      .insert(modelConfig)
      .values({
        name,
        providerId,
        modelId,
        description,
        createdAt: new Date(),
      })
      .returning({ id: modelConfig.id });

    if (credentials && credentials.length > 0) {
      await db.insert(modelConfigCredential).values(
        credentials.map((cred) => ({
          modelConfigId: result.id,
          key: cred.key,
          value: cred.value,
        }))
      );
    }

    return result;
  } catch (error) {
    console.error("Failed to create model", error);
    throw error;
  }
}

export async function removeModel(modelId: string) {
  try {
    await db
      .delete(groupModelAccess)
      .where(eq(groupModelAccess.modelConfigId, modelId));
    await db
      .delete(modelConfigCredential)
      .where(eq(modelConfigCredential.modelConfigId, modelId));
    return await db.delete(modelConfig).where(eq(modelConfig.id, modelId));
  } catch (error) {
    console.error("Failed to remove model", error);
    throw error;
  }
}

export async function assignModelToGroup({
  modelId,
  groupId,
}: {
  modelId: string;
  groupId: string;
}) {
  try {
    return await db.insert(groupModelAccess).values({
      modelConfigId: modelId,
      groupId,
    });
  } catch (error) {
    console.error("Failed to assign model to group", error);
    throw error;
  }
}

export async function removeModelFromGroup({
  modelId,
  groupId,
}: {
  modelId: string;
  groupId: string;
}) {
  try {
    return await db
      .delete(groupModelAccess)
      .where(
        and(
          eq(groupModelAccess.modelConfigId, modelId),
          eq(groupModelAccess.groupId, groupId)
        )
      );
  } catch (error) {
    console.error("Failed to remove model from group", error);
    throw error;
  }
}
