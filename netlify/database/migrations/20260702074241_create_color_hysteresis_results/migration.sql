CREATE TABLE "color_hysteresis_results" (
	"id" serial PRIMARY KEY,
	"forward_switch" integer NOT NULL,
	"backward_switch" integer NOT NULL,
	"direction_first" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
