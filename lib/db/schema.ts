import type { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const user = pgTable("User", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  isAdmin: boolean("isAdmin").notNull().default(false),
});

export type User = InferSelectModel<typeof user>;

export const group = pgTable("Group", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type Group = InferSelectModel<typeof group>;

export const userGroup = pgTable(
  "UserGroup",
  {
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    groupId: uuid("groupId")
      .notNull()
      .references(() => group.id, { onDelete: "cascade" }),
    role: varchar("role", { enum: ["member", "admin"] })
      .notNull()
      .default("member"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.groupId] }),
  })
);

export type UserGroup = InferSelectModel<typeof userGroup>;

export const tool = pgTable("Tool", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  configuration: json("configuration").notNull().default({}),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type Tool = InferSelectModel<typeof tool>;

export const groupToolAccess = pgTable(
  "GroupToolAccess",
  {
    groupId: uuid("groupId")
      .notNull()
      .references(() => group.id, { onDelete: "cascade" }),
    toolId: uuid("toolId")
      .notNull()
      .references(() => tool.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.toolId] }),
  })
);

export type GroupToolAccess = InferSelectModel<typeof groupToolAccess>;

export const modelProvider = pgTable("ModelProvider", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", {
    enum: [
      "openai",
      "anthropic",
      "mistral",
      "cohere",
      "bedrock",
      "ollama",
      "groq",
      "google-vertex",
      "google-generative",
    ],
  }).notNull(),
  baseUrl: text("baseUrl"),
  description: text("description"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  configuration: json("configuration").notNull().default({}),
});

export type ModelProvider = InferSelectModel<typeof modelProvider>;

export const modelConfig = pgTable("ModelConfig", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  providerId: uuid("providerId")
    .notNull()
    .references(() => modelProvider.id, { onDelete: "cascade" }),
  modelId: text("modelId").notNull(), // e.g. gpt-4-turbo, claude-3-opus-20240229, etc
  description: text("description"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  supportsTools: boolean("supportsTools").notNull().default(false),
  supportsImages: boolean("supportsImages").notNull().default(false),
});

export type ModelConfig = InferSelectModel<typeof modelConfig>;

export const modelConfigCredential = pgTable("ModelConfigCredential", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  modelConfigId: uuid("modelConfigId")
    .notNull()
    .references(() => modelConfig.id, { onDelete: "cascade" }),
  key: varchar("key", {
    enum: [
      "apiKey",
      "accessKeyId",
      "secretAccessKey",
      "region",
      "projectId",
      "serviceAccountKey",
    ],
  }).notNull(),
  value: text("value").notNull(),
});

export type ModelConfigCredential = InferSelectModel<
  typeof modelConfigCredential
>;

export const modelConfigSetting = pgTable("ModelConfigSetting", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  modelConfigId: uuid("modelConfigId")
    .notNull()
    .references(() => modelConfig.id, { onDelete: "cascade" }),
  key: text("key").notNull(), // e.g. dimensions, safePrompt, logitBias etc
  value: json("value").notNull(), // Store any provider-specific settings as JSON
});

export type ModelConfigSetting = InferSelectModel<typeof modelConfigSetting>;

export const groupModelAccess = pgTable(
  "GroupModelAccess",
  {
    groupId: uuid("groupId")
      .notNull()
      .references(() => group.id, { onDelete: "cascade" }),
    modelConfigId: uuid("modelConfigId")
      .notNull()
      .references(() => modelConfig.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.modelConfigId] }),
  })
);

export type GroupModelAccess = InferSelectModel<typeof groupModelAccess>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code"] })
      .notNull()
      .default("text"),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
);

export const verifiedUsers = pgTable("VerifiedUsers", {
  email: text("email").notNull(),
});

export type VerifiedUsers = InferSelectModel<typeof verifiedUsers>;
