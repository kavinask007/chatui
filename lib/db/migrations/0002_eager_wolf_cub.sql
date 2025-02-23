CREATE TABLE IF NOT EXISTS "GroupToolAccess" (
	"groupId" uuid NOT NULL,
	"toolId" uuid NOT NULL,
	CONSTRAINT "GroupToolAccess_groupId_toolId_pk" PRIMARY KEY("groupId","toolId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Tool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"configuration" json DEFAULT '{}'::json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GroupToolAccess" ADD CONSTRAINT "GroupToolAccess_groupId_Group_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GroupToolAccess" ADD CONSTRAINT "GroupToolAccess_toolId_Tool_id_fk" FOREIGN KEY ("toolId") REFERENCES "public"."Tool"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
