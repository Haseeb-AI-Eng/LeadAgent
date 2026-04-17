CREATE TABLE `agentMemory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentName` varchar(128) NOT NULL,
	`memoryType` enum('short_term','long_term') NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` longtext NOT NULL,
	`metadata` json,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentMemory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` longtext,
	`status` enum('draft','active','paused','completed','archived') NOT NULL DEFAULT 'draft',
	`targetIndustry` varchar(128),
	`targetLocation` varchar(255),
	`totalLeads` int NOT NULL DEFAULT 0,
	`emailsSent` int NOT NULL DEFAULT 0,
	`emailsOpened` int NOT NULL DEFAULT 0,
	`emailsReplied` int NOT NULL DEFAULT 0,
	`meetingsBooked` int NOT NULL DEFAULT 0,
	`conversionRate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`template` longtext,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`startedAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailRoutingConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`classification` varchar(64) NOT NULL,
	`keywords` json,
	`targetEmail` varchar(320) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailRoutingConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailRoutingConfig_classification_unique` UNIQUE(`classification`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`companyName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`industry` varchar(128),
	`location` varchar(255),
	`score` decimal(5,2) NOT NULL DEFAULT '0.00',
	`status` enum('new','contacted','interested','qualified','converted','rejected') NOT NULL DEFAULT 'new',
	`contactName` varchar(255),
	`phone` varchar(20),
	`website` varchar(255),
	`notes` longtext,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int,
	`campaignId` int,
	`messageType` enum('incoming','outgoing') NOT NULL,
	`source` varchar(64),
	`senderEmail` varchar(320),
	`recipientEmail` varchar(320),
	`subject` varchar(255),
	`content` longtext NOT NULL,
	`classification` varchar(64),
	`routedTo` varchar(320),
	`status` enum('pending','sent','delivered','opened','replied','failed') NOT NULL DEFAULT 'pending',
	`openedAt` timestamp,
	`repliedAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workflowId` int,
	`command` longtext NOT NULL,
	`status` enum('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`priority` int NOT NULL DEFAULT 0,
	`assignedAgent` varchar(64),
	`result` longtext,
	`error` longtext,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` longtext,
	`status` enum('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`totalSteps` int NOT NULL DEFAULT 0,
	`completedSteps` int NOT NULL DEFAULT 0,
	`steps` json,
	`result` longtext,
	`error` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `agentMemory_userId_idx` ON `agentMemory` (`userId`);--> statement-breakpoint
CREATE INDEX `agentMemory_agentName_idx` ON `agentMemory` (`agentName`);--> statement-breakpoint
CREATE INDEX `agentMemory_memoryType_idx` ON `agentMemory` (`memoryType`);--> statement-breakpoint
CREATE INDEX `campaigns_userId_idx` ON `campaigns` (`userId`);--> statement-breakpoint
CREATE INDEX `campaigns_status_idx` ON `campaigns` (`status`);--> statement-breakpoint
CREATE INDEX `emailRoutingConfig_userId_idx` ON `emailRoutingConfig` (`userId`);--> statement-breakpoint
CREATE INDEX `emailRoutingConfig_classification_idx` ON `emailRoutingConfig` (`classification`);--> statement-breakpoint
CREATE INDEX `leads_userId_idx` ON `leads` (`userId`);--> statement-breakpoint
CREATE INDEX `leads_campaignId_idx` ON `leads` (`campaignId`);--> statement-breakpoint
CREATE INDEX `leads_email_idx` ON `leads` (`email`);--> statement-breakpoint
CREATE INDEX `leads_status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `messages_userId_idx` ON `messages` (`userId`);--> statement-breakpoint
CREATE INDEX `messages_leadId_idx` ON `messages` (`leadId`);--> statement-breakpoint
CREATE INDEX `messages_campaignId_idx` ON `messages` (`campaignId`);--> statement-breakpoint
CREATE INDEX `messages_classification_idx` ON `messages` (`classification`);--> statement-breakpoint
CREATE INDEX `messages_status_idx` ON `messages` (`status`);--> statement-breakpoint
CREATE INDEX `tasks_userId_idx` ON `tasks` (`userId`);--> statement-breakpoint
CREATE INDEX `tasks_workflowId_idx` ON `tasks` (`workflowId`);--> statement-breakpoint
CREATE INDEX `tasks_status_idx` ON `tasks` (`status`);--> statement-breakpoint
CREATE INDEX `workflows_userId_idx` ON `workflows` (`userId`);--> statement-breakpoint
CREATE INDEX `workflows_status_idx` ON `workflows` (`status`);