CREATE TABLE "color_hysteresis_poll_votes" (
	"id" serial PRIMARY KEY,
	"theory" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
