CREATE TABLE `food_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`fodmap_group` text NOT NULL,
	`fodmap_type` text NOT NULL,
	`serving_size` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `group_results` (
	`id` text PRIMARY KEY NOT NULL,
	`protocol_run_id` text NOT NULL,
	`fodmap_group` text NOT NULL,
	`tolerance_level` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`protocol_run_id`) REFERENCES `protocol_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notification_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`test_step_id` text NOT NULL,
	`notification_type` text NOT NULL,
	`scheduled_time` integer NOT NULL,
	`sent_status` integer DEFAULT false NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`test_step_id`) REFERENCES `test_steps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `protocol_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`status` text NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `symptom_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`test_step_id` text NOT NULL,
	`symptom_type` text NOT NULL,
	`severity` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`test_step_id`) REFERENCES `test_steps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `test_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`protocol_run_id` text NOT NULL,
	`food_item_id` text NOT NULL,
	`sequence_number` integer NOT NULL,
	`status` text NOT NULL,
	`scheduled_date` integer NOT NULL,
	`completed_date` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`protocol_run_id`) REFERENCES `protocol_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`food_item_id`) REFERENCES `food_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`language_preference` text DEFAULT 'pt' NOT NULL,
	`theme_preference` text DEFAULT 'system' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_email_unique` ON `user_profiles` (`email`);--> statement-breakpoint
CREATE TABLE `washout_periods` (
	`id` text PRIMARY KEY NOT NULL,
	`protocol_run_id` text NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`protocol_run_id`) REFERENCES `protocol_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
-- Performance indexes for frequently queried columns
CREATE INDEX `idx_protocol_runs_user_id` ON `protocol_runs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_protocol_runs_status` ON `protocol_runs` (`status`);--> statement-breakpoint
CREATE INDEX `idx_test_steps_protocol_run_id` ON `test_steps` (`protocol_run_id`);--> statement-breakpoint
CREATE INDEX `idx_test_steps_status` ON `test_steps` (`status`);--> statement-breakpoint
CREATE INDEX `idx_symptom_entries_test_step_id` ON `symptom_entries` (`test_step_id`);--> statement-breakpoint
CREATE INDEX `idx_symptom_entries_timestamp` ON `symptom_entries` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_symptom_entries_test_step_timestamp` ON `symptom_entries` (`test_step_id`, `timestamp`);--> statement-breakpoint
CREATE INDEX `idx_notification_schedules_scheduled_time` ON `notification_schedules` (`scheduled_time`);--> statement-breakpoint
CREATE INDEX `idx_notification_schedules_sent_status` ON `notification_schedules` (`sent_status`);
