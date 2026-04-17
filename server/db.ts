import { MongoClient, Db } from "mongodb";
import { ENV } from "./_core/env";

const MONGODB_URL = process.env.MONGODB_URL ?? "mongodb://localhost:27017";
const MONGODB_NAME = process.env.MONGODB_NAME ?? "game";

let _client: MongoClient | null = null;
let _db: Db | null = null;

async function getDb() {
  if (_db) return _db;

  try {
    _client = new MongoClient(MONGODB_URL, {
      serverApi: {
        version: "1",
        strict: false,
        deprecationErrors: false,
      },
    });
    await _client.connect();
    _db = _client.db(MONGODB_NAME);
  } catch (error) {
    console.warn("[Database] Failed to connect to MongoDB:", error);
    _db = null;
  }

  return _db;
}

type CollectionDocument = Record<string, unknown>;

export type User = {
  id: number;
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type InsertUser = {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role?: "user" | "admin";
  lastSignedIn?: Date;
};

export type Task = {
  id: number;
  userId: number;
  workflowId?: number | null;
  command: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  priority: number;
  assignedAgent?: string | null;
  result?: string | null;
  error?: string | null;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
};

export type Workflow = {
  id: number;
  userId: number;
  name: string;
  description?: string | null;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  totalSteps: number;
  completedSteps: number;
  steps?: unknown;
  metadata?: Record<string, unknown> | null;
  result?: string | null;
  error?: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
};

export type Lead = {
  id: number;
  userId: number;
  campaignId?: number | null;
  companyName: string;
  email: string;
  industry?: string | null;
  location?: string | null;
  score: number;
  status: "new" | "contacted" | "interested" | "qualified" | "converted" | "rejected";
  contactName?: string | null;
  phone?: string | null;
  website?: string | null;
  notes?: string | null;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export type Campaign = {
  id: number;
  userId: number;
  name: string;
  description?: string | null;
  status?: string | null;
  workflowId?: number | null;
  metrics?: {
    emailsSent?: number;
    emailsOpened?: number;
    emailsReplied?: number;
    meetingsBooked?: number;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Message = {
  id: number;
  userId: number;
  leadId?: number | null;
  campaignId?: number | null;
  messageType?: "incoming" | "outgoing" | null;
  source?: string | null;
  senderEmail: string;
  recipientEmail?: string | null;
  subject: string;
  content: string;
  classification?: string | null;
  routedTo?: string | null;
  status?: string | null;
  result?: string | null;
  error?: string | null;
  metadata?: unknown;
  openedAt?: Date | null;
  repliedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EmailRoutingConfig = {
  id: number;
  userId: number;
  classification: string;
  targetEmail: string;
  keywords?: string[] | null;
  rules?: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export type AgentMemory = {
  id: number;
  userId: number;
  agentName: string;
  key: string;
  memoryType: "short_term" | "long_term";
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
};

async function getCollection<T extends CollectionDocument>(name: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return db.collection<T>(name);
}

async function nextId(sequenceName: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const counters = db.collection<{ _id: string; seq: number }>("counters");
  const result = await counters.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  return result.value?.seq ?? 1;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const usersCollection = await getCollection<User>("users");
  const existing = await usersCollection.findOne({ openId: user.openId });
  const now = new Date();
  const role =
    user.role ??
    (user.openId === ENV.ownerOpenId ? "admin" : "user");

  if (existing) {
    await usersCollection.updateOne(
      { openId: user.openId },
      {
        $set: {
          name: user.name ?? existing.name ?? null,
          email: user.email ?? existing.email ?? null,
          loginMethod: user.loginMethod ?? existing.loginMethod ?? null,
          role: existing.role || role,
          lastSignedIn: user.lastSignedIn ?? existing.lastSignedIn ?? now,
          updatedAt: now,
        },
      }
    );
    return;
  }

  const id = await nextId("users");
  await usersCollection.insertOne({
    id,
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    role,
    lastSignedIn: user.lastSignedIn ?? now,
    createdAt: now,
    updatedAt: now,
  });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const usersCollection = await getCollection<User>("users");
  return (await usersCollection.findOne({ openId })) ?? undefined;
}

export async function getOrCreateGuestUser(): Promise<User> {
  const guestOpenId = process.env.GUEST_USER_OPENID ?? "guest";
  const usersCollection = await getCollection<User>("users");

  let user = await usersCollection.findOne({ openId: guestOpenId });
  if (user) return user;

  const now = new Date();
  const id = await nextId("users");

  const guestUser: User = {
    id,
    openId: guestOpenId,
    name: "Guest",
    email: null,
    loginMethod: "guest",
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };

  await usersCollection.insertOne(guestUser);
  return guestUser;
}

function buildTimestampedRecord<T extends { createdAt?: Date; updatedAt?: Date }>(record: T) {
  const now = new Date();
  return {
    ...record,
    createdAt: record.createdAt ?? now,
    updatedAt: record.updatedAt ?? now,
  };
}

export async function createTask(userId: number, task: Omit<Task, "id" | "userId" | "createdAt" | "updatedAt">) {
  const tasksCollection = await getCollection<Task>("tasks");
  const id = await nextId("tasks");
  const record: Task = {
    id,
    userId,
    command: task.command,
    workflowId: task.workflowId ?? null,
    status: task.status ?? "pending",
    priority: task.priority ?? 0,
    assignedAgent: task.assignedAgent ?? null,
    result: task.result ?? null,
    error: task.error ?? null,
    metadata: task.metadata ?? null,
    completedAt: task.completedAt ?? null,
    ...buildTimestampedRecord({}),
  };
  await tasksCollection.insertOne(record);
  return record;
}

export async function getTasksByUserId(userId: number) {
  const tasksCollection = await getCollection<Task>("tasks");
  return tasksCollection.find({ userId }).sort({ createdAt: -1 }).toArray();
}

export async function getTaskById(taskId: number, userId: number) {
  const tasksCollection = await getCollection<Task>("tasks");
  return tasksCollection.findOne({ id: taskId, userId });
}

export async function updateTask(taskId: number, userId: number, updates: Partial<Omit<Task, "id" | "userId" | "createdAt">>) {
  const tasksCollection = await getCollection<Task>("tasks");
  const result = await tasksCollection.findOneAndUpdate(
    { id: taskId, userId },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );
  return result.value;
}

export async function createWorkflow(userId: number, workflow: Omit<Workflow, "id" | "userId" | "createdAt" | "updatedAt">) {
  const workflowsCollection = await getCollection<Workflow>("workflows");
  const id = await nextId("workflows");
  const record: Workflow = {
    id,
    userId,
    name: workflow.name,
    description: workflow.description ?? null,
    status: workflow.status ?? "pending",
    totalSteps: workflow.totalSteps ?? 0,
    completedSteps: workflow.completedSteps ?? 0,
    steps: workflow.steps ?? null,
    metadata: workflow.metadata ?? null,
    result: workflow.result ?? null,
    error: workflow.error ?? null,
    completedAt: workflow.completedAt ?? null,
    ...buildTimestampedRecord({}),
  };
  await workflowsCollection.insertOne(record);
  return record;
}

export async function getWorkflowsByUserId(userId: number) {
  const workflowsCollection = await getCollection<Workflow>("workflows");
  return workflowsCollection.find({ userId }).sort({ createdAt: -1 }).toArray();
}

export async function getWorkflowById(workflowId: number, userId: number) {
  const workflowsCollection = await getCollection<Workflow>("workflows");
  return workflowsCollection.findOne({ id: workflowId, userId });
}

export async function updateWorkflow(workflowId: number, userId: number, updates: Partial<Omit<Workflow, "id" | "userId" | "createdAt">>) {
  const workflowsCollection = await getCollection<Workflow>("workflows");
  const result = await workflowsCollection.findOneAndUpdate(
    { id: workflowId, userId },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );
  return result.value;
}

export async function createLead(userId: number, lead: Omit<Lead, "id" | "userId" | "createdAt" | "updatedAt">) {
  const leadsCollection = await getCollection<Lead>("leads");
  const id = await nextId("leads");
  const record: Lead = {
    id,
    userId,
    campaignId: lead.campaignId ?? null,
    companyName: lead.companyName,
    email: lead.email,
    industry: lead.industry ?? null,
    location: lead.location ?? null,
    score: lead.score ?? 0,
    status: lead.status ?? "new",
    contactName: lead.contactName ?? null,
    phone: lead.phone ?? null,
    website: lead.website ?? null,
    notes: lead.notes ?? null,
    metadata: lead.metadata ?? null,
    ...buildTimestampedRecord({}),
  };
  await leadsCollection.insertOne(record);
  return record;
}

export async function getLeadsByUserId(userId: number) {
  const leadsCollection = await getCollection<Lead>("leads");
  return leadsCollection.find({ userId }).sort({ createdAt: -1 }).toArray();
}

export async function getLeadsByCampaignId(campaignId: number, userId: number) {
  const leadsCollection = await getCollection<Lead>("leads");
  return leadsCollection.find({ campaignId, userId }).sort({ score: -1 }).toArray();
}

export async function getLeadById(leadId: number, userId: number) {
  const leadsCollection = await getCollection<Lead>("leads");
  return leadsCollection.findOne({ id: leadId, userId });
}

export async function updateLead(leadId: number, userId: number, updates: Partial<Omit<Lead, "id" | "userId" | "createdAt">>) {
  const leadsCollection = await getCollection<Lead>("leads");
  const result = await leadsCollection.findOneAndUpdate(
    { id: leadId, userId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result.value;
}

export async function createCampaign(userId: number, campaign: Omit<Campaign, "id" | "userId" | "createdAt" | "updatedAt">) {
  const campaignsCollection = await getCollection<Campaign>("campaigns");
  const id = await nextId("campaigns");
  const record: Campaign = {
    id,
    userId,
    name: campaign.name,
    description: campaign.description ?? null,
    status: campaign.status ?? null,
    workflowId: campaign.workflowId ?? null,
    metrics: campaign.metrics ?? null,
    ...buildTimestampedRecord({}),
  };
  await campaignsCollection.insertOne(record);
  return record;
}

export async function getCampaignsByUserId(userId: number) {
  const campaignsCollection = await getCollection<Campaign>("campaigns");
  return campaignsCollection.find({ userId }).sort({ createdAt: -1 }).toArray();
}

export async function getCampaignById(campaignId: number, userId: number) {
  const campaignsCollection = await getCollection<Campaign>("campaigns");
  return campaignsCollection.findOne({ id: campaignId, userId });
}

export async function updateCampaign(campaignId: number, userId: number, updates: Partial<Omit<Campaign, "id" | "userId" | "createdAt">>) {
  const campaignsCollection = await getCollection<Campaign>("campaigns");
  const result = await campaignsCollection.findOneAndUpdate(
    { id: campaignId, userId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result.value;
}

export async function createMessage(userId: number, message: Omit<Message, "id" | "userId" | "createdAt" | "updatedAt">) {
  const messagesCollection = await getCollection<Message>("messages");
  const id = await nextId("messages");
  const record: Message = {
    id,
    userId,
    leadId: message.leadId ?? null,
    campaignId: message.campaignId ?? null,
    messageType: message.messageType ?? null,
    source: message.source ?? null,
    senderEmail: message.senderEmail,
    recipientEmail: message.recipientEmail ?? null,
    subject: message.subject,
    content: message.content,
    classification: message.classification ?? null,
    routedTo: message.routedTo ?? null,
    status: message.status ?? null,
    result: message.result ?? null,
    error: message.error ?? null,
    metadata: message.metadata ?? null,
    openedAt: message.openedAt ?? null,
    repliedAt: message.repliedAt ?? null,
    ...buildTimestampedRecord({}),
  };
  await messagesCollection.insertOne(record);
  return record;
}

export async function getMessagesByUserId(userId: number) {
  const messagesCollection = await getCollection<Message>("messages");
  return messagesCollection.find({ userId }).sort({ createdAt: -1 }).toArray();
}

export async function getMessagesByLeadId(leadId: number, userId: number) {
  const messagesCollection = await getCollection<Message>("messages");
  return messagesCollection.find({ leadId, userId }).sort({ createdAt: -1 }).toArray();
}

export async function getMessageById(messageId: number, userId: number) {
  const messagesCollection = await getCollection<Message>("messages");
  return messagesCollection.findOne({ id: messageId, userId });
}

export async function updateMessage(messageId: number, userId: number, updates: Partial<Omit<Message, "id" | "userId" | "createdAt">>) {
  const messagesCollection = await getCollection<Message>("messages");
  const result = await messagesCollection.findOneAndUpdate(
    { id: messageId, userId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result.value;
}

export async function createEmailRoutingConfig(userId: number, config: Omit<EmailRoutingConfig, "id" | "userId" | "createdAt" | "updatedAt">) {
  const configCollection = await getCollection<EmailRoutingConfig>("emailRoutingConfig");
  const id = await nextId("emailRoutingConfig");
  const record: EmailRoutingConfig = {
    id,
    userId,
    classification: config.classification,
    targetEmail: config.targetEmail,
    keywords: config.keywords ?? null,
    rules: config.rules ?? null,
    ...buildTimestampedRecord({}),
  };
  await configCollection.insertOne(record);
  return record;
}

export async function getEmailRoutingConfigByUserId(userId: number) {
  const configCollection = await getCollection<EmailRoutingConfig>("emailRoutingConfig");
  return configCollection.find({ userId }).toArray();
}

export async function getEmailRoutingConfigByClassification(classification: string, userId: number) {
  const configCollection = await getCollection<EmailRoutingConfig>("emailRoutingConfig");
  return configCollection.findOne({ classification, userId });
}

/**
 * Delete all leads for a user
 */
export async function deleteAllLeadsByUserId(userId: number): Promise<number> {
  const leadsCollection = await getCollection<Lead>("leads");
  const result = await leadsCollection.deleteMany({ userId });
  return result.deletedCount || 0;
}

/**
 * Delete all messages for a user
 */
export async function deleteAllMessagesByUserId(userId: number): Promise<number> {
  const messagesCollection = await getCollection<Message>("messages");
  const result = await messagesCollection.deleteMany({ userId });
  return result.deletedCount || 0;
}

/**
 * Delete all campaigns for a user
 */
export async function deleteAllCampaignsByUserId(userId: number): Promise<number> {
  const campaignsCollection = await getCollection<Campaign>("campaigns");
  const result = await campaignsCollection.deleteMany({ userId });
  return result.deletedCount || 0;
}

/**
 * Check if lead with same website already exists for user
 */
export async function leadWithWebsiteExists(userId: number, website: string): Promise<boolean> {
  if (!website) return false;
  const leadsCollection = await getCollection<Lead>("leads");
  const existing = await leadsCollection.findOne({ userId, website });
  return !!existing;
}

/**
 * Check if lead with same email already exists for user
 */
export async function leadWithEmailExists(userId: number, email: string): Promise<boolean> {
  if (!email) return false;
  const leadsCollection = await getCollection<Lead>("leads");
  const existing = await leadsCollection.findOne({ userId, email });
  return !!existing;
}

export async function updateEmailRoutingConfig(configId: number, userId: number, updates: Partial<Omit<EmailRoutingConfig, "id" | "userId" | "createdAt">>) {
  const configCollection = await getCollection<EmailRoutingConfig>("emailRoutingConfig");
  const result = await configCollection.findOneAndUpdate(
    { id: configId, userId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result.value;
}

export async function createAgentMemory(userId: number, memory: Omit<AgentMemory, "id" | "userId" | "createdAt" | "updatedAt">) {
  const memoryCollection = await getCollection<AgentMemory>("agentMemory");
  const id = await nextId("agentMemory");
  const record: AgentMemory = {
    id,
    userId,
    agentName: memory.agentName,
    key: memory.key,
    memoryType: memory.memoryType,
    value: memory.value,
    ...buildTimestampedRecord({}),
  };
  await memoryCollection.insertOne(record);
  return record;
}

export async function getAgentMemoryByKey(userId: number, agentName: string, key: string) {
  const memoryCollection = await getCollection<AgentMemory>("agentMemory");
  return memoryCollection.findOne({ userId, agentName, key });
}

export async function getAgentMemoryByAgent(userId: number, agentName: string, memoryType: "short_term" | "long_term") {
  const memoryCollection = await getCollection<AgentMemory>("agentMemory");
  return memoryCollection.find({ userId, agentName, memoryType }).toArray();
}

export async function updateAgentMemory(memoryId: number, userId: number, updates: Partial<Omit<AgentMemory, "id" | "userId" | "createdAt">>) {
  const memoryCollection = await getCollection<AgentMemory>("agentMemory");
  const result = await memoryCollection.findOneAndUpdate(
    { id: memoryId, userId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result.value;
}

export async function deleteAgentMemory(memoryId: number, userId: number) {
  const memoryCollection = await getCollection<AgentMemory>("agentMemory");
  const result = await memoryCollection.deleteOne({ id: memoryId, userId });
  return result.deletedCount > 0;
}
