CREATE TABLE IF NOT EXISTS "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authenticator" (
	"credentialID" text NOT NULL,
	"userId" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticator_userId_credentialID_pk" PRIMARY KEY("userId","credentialID"),
	CONSTRAINT "authenticator_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp NOT NULL,
	"title" text NOT NULL,
	"userId" text NOT NULL,
	"visibility" varchar DEFAULT 'private' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Document" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"text" varchar DEFAULT 'text' NOT NULL,
	"userId" text NOT NULL,
	CONSTRAINT "Document_id_createdAt_pk" PRIMARY KEY("id","createdAt")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "GroupModelAccess" (
	"groupId" uuid NOT NULL,
	"modelConfigId" uuid NOT NULL,
	CONSTRAINT "GroupModelAccess_groupId_modelConfigId_pk" PRIMARY KEY("groupId","modelConfigId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"role" varchar NOT NULL,
	"content" json NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ModelConfig" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"providerId" uuid NOT NULL,
	"modelId" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ModelConfigCredential" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modelConfigId" uuid NOT NULL,
	"key" varchar NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ModelConfigSetting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modelConfigId" uuid NOT NULL,
	"key" text NOT NULL,
	"value" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ModelProvider" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"baseUrl" text,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Suggestion" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"documentId" uuid NOT NULL,
	"documentCreatedAt" timestamp NOT NULL,
	"originalText" text NOT NULL,
	"suggestedText" text NOT NULL,
	"description" text,
	"isResolved" boolean DEFAULT false NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	CONSTRAINT "Suggestion_id_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" varchar(64) NOT NULL,
	"password" varchar(64),
	"emailVerified" timestamp,
	"image" text,
	"isAdmin" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserGroup" (
	"userId" text NOT NULL,
	"groupId" uuid NOT NULL,
	"role" varchar DEFAULT 'member' NOT NULL,
	CONSTRAINT "UserGroup_userId_groupId_pk" PRIMARY KEY("userId","groupId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "VerifiedUsers" (
	"email" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Vote" (
	"chatId" uuid NOT NULL,
	"messageId" uuid NOT NULL,
	"isUpvoted" boolean NOT NULL,
	CONSTRAINT "Vote_chatId_messageId_pk" PRIMARY KEY("chatId","messageId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GroupModelAccess" ADD CONSTRAINT "GroupModelAccess_groupId_Group_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GroupModelAccess" ADD CONSTRAINT "GroupModelAccess_modelConfigId_ModelConfig_id_fk" FOREIGN KEY ("modelConfigId") REFERENCES "public"."ModelConfig"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ModelConfig" ADD CONSTRAINT "ModelConfig_providerId_ModelProvider_id_fk" FOREIGN KEY ("providerId") REFERENCES "public"."ModelProvider"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ModelConfigCredential" ADD CONSTRAINT "ModelConfigCredential_modelConfigId_ModelConfig_id_fk" FOREIGN KEY ("modelConfigId") REFERENCES "public"."ModelConfig"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ModelConfigSetting" ADD CONSTRAINT "ModelConfigSetting_modelConfigId_ModelConfig_id_fk" FOREIGN KEY ("modelConfigId") REFERENCES "public"."ModelConfig"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_fk" FOREIGN KEY ("documentId","documentCreatedAt") REFERENCES "public"."Document"("id","createdAt") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_groupId_Group_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote" ADD CONSTRAINT "Vote_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote" ADD CONSTRAINT "Vote_messageId_Message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
