import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  json,
  boolean,
  longtext,
  index
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tasks table - stores individual tasks created from command decomposition
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workflowId: int("workflowId"),
  command: longtext("command").notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "cancelled"]).default("pending").notNull(),
  priority: int("priority").default(0).notNull(),
  assignedAgent: varchar("assignedAgent", { length: 64 }),
  result: longtext("result"),
  error: longtext("error"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  userIdIdx: index("tasks_userId_idx").on(table.userId),
  workflowIdIdx: index("tasks_workflowId_idx").on(table.workflowId),
  statusIdx: index("tasks_status_idx").on(table.status),
}));

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Workflows table - stores multi-step workflows orchestrated by master agent
 */
export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: longtext("description"),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "cancelled"]).default("pending").notNull(),
  totalSteps: int("totalSteps").default(0).notNull(),
  completedSteps: int("completedSteps").default(0).notNull(),
  steps: json("steps"), // Array of step definitions
  result: longtext("result"),
  error: longtext("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  userIdIdx: index("workflows_userId_idx").on(table.userId),
  statusIdx: index("workflows_status_idx").on(table.status),
}));

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

/**
 * Leads table - stores potential customers/leads
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId"),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  industry: varchar("industry", { length: 128 }),
  location: varchar("location", { length: 255 }),
  score: decimal("score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  status: mysqlEnum("status", ["new", "contacted", "interested", "qualified", "converted", "rejected"]).default("new").notNull(),
  contactName: varchar("contactName", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  website: varchar("website", { length: 255 }),
  notes: longtext("notes"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("leads_userId_idx").on(table.userId),
  campaignIdIdx: index("leads_campaignId_idx").on(table.campaignId),
  emailIdx: index("leads_email_idx").on(table.email),
  statusIdx: index("leads_status_idx").on(table.status),
}));

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Campaigns table - stores outreach campaigns
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: longtext("description"),
  status: mysqlEnum("status", ["draft", "active", "paused", "completed", "archived"]).default("draft").notNull(),
  targetIndustry: varchar("targetIndustry", { length: 128 }),
  targetLocation: varchar("targetLocation", { length: 255 }),
  totalLeads: int("totalLeads").default(0).notNull(),
  emailsSent: int("emailsSent").default(0).notNull(),
  emailsOpened: int("emailsOpened").default(0).notNull(),
  emailsReplied: int("emailsReplied").default(0).notNull(),
  meetingsBooked: int("meetingsBooked").default(0).notNull(),
  conversionRate: decimal("conversionRate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  template: longtext("template"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  userIdIdx: index("campaigns_userId_idx").on(table.userId),
  statusIdx: index("campaigns_status_idx").on(table.status),
}));

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * Messages table - stores incoming and outgoing messages
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId"),
  campaignId: int("campaignId"),
  messageType: mysqlEnum("messageType", ["incoming", "outgoing"]).notNull(),
  source: varchar("source", { length: 64 }), // email, linkedin, etc
  senderEmail: varchar("senderEmail", { length: 320 }),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  subject: varchar("subject", { length: 255 }),
  content: longtext("content").notNull(),
  classification: varchar("classification", { length: 64 }), // ai_ml, mobile, ui_ux, general
  routedTo: varchar("routedTo", { length: 320 }), // Email address it was routed to
  status: mysqlEnum("status", ["pending", "sent", "delivered", "opened", "replied", "failed"]).default("pending").notNull(),
  openedAt: timestamp("openedAt"),
  repliedAt: timestamp("repliedAt"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("messages_userId_idx").on(table.userId),
  leadIdIdx: index("messages_leadId_idx").on(table.leadId),
  campaignIdIdx: index("messages_campaignId_idx").on(table.campaignId),
  classificationIdx: index("messages_classification_idx").on(table.classification),
  statusIdx: index("messages_status_idx").on(table.status),
}));

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Email Routing Configuration - stores routing rules for message classification
 */
export const emailRoutingConfig = mysqlTable("emailRoutingConfig", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  classification: varchar("classification", { length: 64 }).notNull().unique(),
  keywords: json("keywords"), // Array of keywords to match
  targetEmail: varchar("targetEmail", { length: 320 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("emailRoutingConfig_userId_idx").on(table.userId),
  classificationIdx: index("emailRoutingConfig_classification_idx").on(table.classification),
}));

export type EmailRoutingConfig = typeof emailRoutingConfig.$inferSelect;
export type InsertEmailRoutingConfig = typeof emailRoutingConfig.$inferInsert;

/**
 * Agent Memory - stores long-term memory for agents
 */
export const agentMemory = mysqlTable("agentMemory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentName: varchar("agentName", { length: 128 }).notNull(),
  memoryType: mysqlEnum("memoryType", ["short_term", "long_term"]).notNull(),
  key: varchar("key", { length: 255 }).notNull(),
  value: longtext("value").notNull(),
  metadata: json("metadata"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("agentMemory_userId_idx").on(table.userId),
  agentNameIdx: index("agentMemory_agentName_idx").on(table.agentName),
  memoryTypeIdx: index("agentMemory_memoryType_idx").on(table.memoryType),
}));

export type AgentMemory = typeof agentMemory.$inferSelect;
export type InsertAgentMemory = typeof agentMemory.$inferInsert;
