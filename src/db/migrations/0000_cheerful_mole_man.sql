CREATE TABLE `account_credits` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`household_id` text NOT NULL,
	`amount` integer NOT NULL,
	`remaining_amount` integer NOT NULL,
	`type` text DEFAULT 'other',
	`description` text,
	`reference` text,
	`expires_at` integer,
	`created_by` text,
	`created_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`line_1` text NOT NULL,
	`line_2` text,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`postal_code` text NOT NULL,
	`country` text DEFAULT 'US' NOT NULL,
	`is_default` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `application_checklists` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`item_name` text NOT NULL,
	`item_type` text DEFAULT 'other',
	`is_required` integer DEFAULT true,
	`is_completed` integer DEFAULT false,
	`completed_at` integer,
	`completed_by` text,
	`notes` text,
	`sort_order` integer DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`completed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `application_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`name` text NOT NULL,
	`document_type` text DEFAULT 'other',
	`file_url` text NOT NULL,
	`file_name` text,
	`file_size` integer,
	`mime_type` text,
	`uploaded_by` text,
	`created_at` integer,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `application_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`section_name` text NOT NULL,
	`responses` text NOT NULL,
	`completed_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`student_id` text NOT NULL,
	`household_id` text NOT NULL,
	`school_year_id` text,
	`application_type` text DEFAULT 'new',
	`school_year` text NOT NULL,
	`grade_applying_for` text NOT NULL,
	`status` text DEFAULT 'draft',
	`submitted_at` integer,
	`last_saved_at` integer,
	`decision_at` integer,
	`decision_by` text,
	`decision_notes` text,
	`application_fee_amount` integer,
	`application_fee_paid` integer DEFAULT false,
	`application_fee_paid_at` integer,
	`application_fee_stripe_payment_id` text,
	`interview_scheduled_at` integer,
	`interview_completed_at` integer,
	`interview_notes` text,
	`waitlist_position` integer,
	`waitlist_notes` text,
	`lead_id` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`school_year_id`) REFERENCES `school_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decision_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`image_url` text,
	`sort_order` integer DEFAULT 0,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `discount_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`value` real DEFAULT 0 NOT NULL,
	`min_order_amount` real,
	`max_discount_amount` real,
	`max_uses` integer,
	`max_uses_per_customer` integer DEFAULT 1,
	`used_count` integer DEFAULT 0,
	`starts_at` integer,
	`expires_at` integer,
	`active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discount_codes_code_unique` ON `discount_codes` (`code`);--> statement-breakpoint
CREATE TABLE `discount_usages` (
	`id` text PRIMARY KEY NOT NULL,
	`discount_code_id` text NOT NULL,
	`order_id` text,
	`customer_id` text,
	`customer_email` text,
	`discount_amount` real NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`discount_code_id`) REFERENCES `discount_codes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `gift_card_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`gift_card_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`balance_after` real NOT NULL,
	`order_id` text,
	`description` text,
	`created_by` text,
	`created_at` integer,
	FOREIGN KEY (`gift_card_id`) REFERENCES `gift_cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `gift_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`initial_balance` real NOT NULL,
	`current_balance` real NOT NULL,
	`purchaser_id` text,
	`purchaser_email` text,
	`purchase_order_id` text,
	`recipient_email` text,
	`recipient_name` text,
	`personal_message` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer,
	`delivered_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`purchaser_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`purchase_order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gift_cards_code_unique` ON `gift_cards` (`code`);--> statement-breakpoint
CREATE TABLE `guardians` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`user_id` text,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`phone` text,
	`phone_type` text DEFAULT 'mobile',
	`relationship` text,
	`is_primary` integer DEFAULT false,
	`has_portal_access` integer DEFAULT true,
	`is_billing_contact` integer DEFAULT false,
	`is_emergency_contact` integer DEFAULT false,
	`can_pickup` integer DEFAULT true,
	`employer` text,
	`occupation` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `households` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text,
	`primary_email` text,
	`primary_phone` text,
	`address_line_1` text,
	`address_line_2` text,
	`city` text,
	`state` text,
	`postal_code` text,
	`country` text DEFAULT 'US',
	`stripe_customer_id` text,
	`default_payment_method_id` text,
	`auto_pay` integer DEFAULT false,
	`status` text DEFAULT 'prospective',
	`notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`student_id` text,
	`description` text NOT NULL,
	`item_type` text DEFAULT 'other',
	`quantity` integer DEFAULT 1,
	`unit_amount` integer NOT NULL,
	`amount` integer NOT NULL,
	`period_start` text,
	`period_end` text,
	`sort_order` integer DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`household_id` text NOT NULL,
	`invoice_number` text,
	`description` text,
	`subtotal` integer DEFAULT 0 NOT NULL,
	`discount_amount` integer DEFAULT 0,
	`credit_amount` integer DEFAULT 0,
	`total` integer DEFAULT 0 NOT NULL,
	`amount_paid` integer DEFAULT 0,
	`amount_due` integer DEFAULT 0 NOT NULL,
	`issue_date` text,
	`due_date` text,
	`period_start` text,
	`period_end` text,
	`status` text DEFAULT 'draft',
	`sent_at` integer,
	`paid_at` integer,
	`voided_at` integer,
	`void_reason` text,
	`stripe_invoice_id` text,
	`notes` text,
	`memo` text,
	`created_by` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `lead_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`type` text NOT NULL,
	`subject` text,
	`description` text,
	`performed_by` text,
	`metadata` text,
	`created_at` integer,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`phone` text,
	`source` text DEFAULT 'website',
	`source_detail` text,
	`stage` text DEFAULT 'inquiry',
	`interested_grades` text,
	`interested_school_year` text,
	`number_of_students` integer DEFAULT 1,
	`notes` text,
	`converted_to_household_id` text,
	`converted_at` integer,
	`lost_reason` text,
	`lost_at` integer,
	`assigned_to` text,
	`last_contacted_at` integer,
	`next_follow_up_at` integer,
	`tour_scheduled_at` integer,
	`tour_completed_at` integer,
	`tour_notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`converted_to_household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `oauth_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`email` text,
	`access_token` text,
	`refresh_token` text,
	`expires_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `order_events` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`metadata` text,
	`created_by` text,
	`created_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`product_slug` text NOT NULL,
	`product_image` text,
	`quantity` integer NOT NULL,
	`unit_price` real NOT NULL,
	`total_price` real NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`stripe_session_id` text,
	`stripe_payment_intent_id` text,
	`subtotal` real NOT NULL,
	`shipping_amount` real DEFAULT 0 NOT NULL,
	`tax_amount` real DEFAULT 0 NOT NULL,
	`discount_amount` real DEFAULT 0 NOT NULL,
	`total_amount` real NOT NULL,
	`shipping_address` text,
	`shipping_method` text,
	`tracking_number` text,
	`tracking_url` text,
	`shipped_at` integer,
	`delivered_at` integer,
	`discount_code` text,
	`notes` text,
	`customer_notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`stripe_payment_method_id` text NOT NULL,
	`type` text,
	`last_4` text,
	`brand` text,
	`expiry_month` integer,
	`expiry_year` integer,
	`is_default` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payment_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`household_id` text NOT NULL,
	`student_id` text,
	`name` text NOT NULL,
	`description` text,
	`total_amount` integer NOT NULL,
	`paid_amount` integer DEFAULT 0,
	`remaining_amount` integer NOT NULL,
	`number_of_payments` integer NOT NULL,
	`payment_amount` integer NOT NULL,
	`frequency` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`day_of_month` integer,
	`day_of_week` integer,
	`auto_pay` integer DEFAULT false,
	`payment_method_id` text,
	`status` text DEFAULT 'draft',
	`created_by` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`household_id` text NOT NULL,
	`invoice_id` text,
	`amount` integer NOT NULL,
	`refunded_amount` integer DEFAULT 0,
	`method` text NOT NULL,
	`status` text DEFAULT 'pending',
	`stripe_payment_intent_id` text,
	`stripe_charge_id` text,
	`check_number` text,
	`reference_number` text,
	`notes` text,
	`processed_at` integer,
	`processed_by` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`processed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `product_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`title` text,
	`body` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`verified` integer DEFAULT false,
	`helpful` integer DEFAULT 0,
	`admin_notes` text,
	`reviewed_at` integer,
	`reviewed_by` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`short_description` text,
	`price` real NOT NULL,
	`compare_at_price` real,
	`category` text,
	`ingredients` text,
	`image_url` text,
	`images` text,
	`stripe_product_id` text,
	`stripe_price_id` text,
	`in_stock` integer DEFAULT true,
	`stock_quantity` integer DEFAULT 0,
	`low_stock_threshold` integer DEFAULT 10,
	`weight` real,
	`featured` integer DEFAULT false,
	`sort_order` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `scheduled_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_plan_id` text NOT NULL,
	`amount` integer NOT NULL,
	`due_date` text NOT NULL,
	`status` text DEFAULT 'scheduled',
	`payment_id` text,
	`processed_at` integer,
	`failure_reason` text,
	`retry_count` integer DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`payment_plan_id`) REFERENCES `payment_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `school_members` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`school_id` text NOT NULL,
	`role` text DEFAULT 'readonly' NOT NULL,
	`invited_by` text,
	`invited_at` integer,
	`accepted_at` integer,
	`status` text DEFAULT 'pending',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `school_members_user_id_school_id_unique` ON `school_members` (`user_id`,`school_id`);--> statement-breakpoint
CREATE TABLE `school_years` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`enrollment_open_date` integer,
	`enrollment_close_date` integer,
	`is_current` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`subdomain` text,
	`timezone` text DEFAULT 'America/New_York',
	`current_school_year` text,
	`grades_offered` text,
	`stripe_account_id` text,
	`stripe_account_status` text DEFAULT 'pending',
	`logo_url` text,
	`primary_color` text DEFAULT '#2F5D50',
	`accent_color` text DEFAULT '#1F2A44',
	`google_client_id` text,
	`google_client_secret` text,
	`email` text,
	`phone` text,
	`address_line_1` text,
	`address_line_2` text,
	`city` text,
	`state` text,
	`postal_code` text,
	`country` text DEFAULT 'US',
	`status` text DEFAULT 'trial',
	`trial_ends_at` integer,
	`plan_id` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schools_slug_unique` ON `schools` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `schools_subdomain_unique` ON `schools` (`subdomain`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `student_households` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`household_id` text NOT NULL,
	`is_primary` integer DEFAULT true,
	`billing_percentage` integer DEFAULT 100,
	`custody_notes` text,
	`created_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_households_student_id_household_id_unique` ON `student_households` (`student_id`,`household_id`);--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`household_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`preferred_name` text,
	`date_of_birth` text,
	`gender` text,
	`grade_level` text,
	`enrollment_status` text DEFAULT 'prospective',
	`enrolled_date` text,
	`withdrawn_date` text,
	`expected_graduation_year` integer,
	`allergies` text,
	`medical_notes` text,
	`medications` text,
	`previous_school` text,
	`student_number` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`role` text DEFAULT 'customer' NOT NULL,
	`stripe_customer_id` text,
	`first_name` text,
	`last_name` text,
	`email_verified` integer DEFAULT false,
	`marketing_consent` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);