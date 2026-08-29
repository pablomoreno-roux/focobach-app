CREATE TABLE "app_data" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_data_user_key_unique" UNIQUE("user_id","key")
);
