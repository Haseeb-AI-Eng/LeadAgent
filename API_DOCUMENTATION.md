# ABOA - API Documentation

## Overview

ABOA (Autonomous Business Operations Agent) provides a comprehensive tRPC API for orchestrating intelligent business workflows. All endpoints are protected and require authentication.

## Authentication

All API endpoints require a valid session. Authentication is handled via Manus OAuth. Login redirects to `/api/oauth/callback` which establishes a session cookie.

## Master Agent Endpoints

### `masterAgent.decomposeCommand`
Analyzes a natural language command and decomposes it into actionable steps.

**Input:**
```typescript
{
  command: string  // Natural language command
}
```

**Output:**
```typescript
{
  steps: Array<{
    name: string
    description: string
    agent: string
    dependencies: string[]
  }>
  estimatedDuration: string
}
```

**Example:**
```typescript
const result = await trpc.masterAgent.decomposeCommand.mutate({
  command: "Find 100 restaurants in New York and send marketing emails"
});
```

---

### `masterAgent.createWorkflow`
Creates a workflow from a natural language command.

**Input:**
```typescript
{
  command: string
}
```

**Output:**
```typescript
{
  workflowId: number
}
```

---

### `masterAgent.executeWorkflow`
Executes an existing workflow.

**Input:**
```typescript
{
  workflowId: number
}
```

**Output:**
```typescript
{
  success: boolean
}
```

---

### `masterAgent.monitorWorkflow`
Monitors the status of a running workflow.

**Input:**
```typescript
{
  workflowId: number
}
```

**Output:**
```typescript
{
  id: number
  name: string
  status: "pending" | "running" | "completed" | "failed"
  progressPercentage: number
  progress: string
  steps: Array<{
    id: string
    name: string
    agent: string
    status: "pending" | "running" | "completed" | "failed"
    description: string
    dependencies: string[]
  }>
  createdAt: Date
  updatedAt: Date
}
```

---

## Lead Generation Endpoints

### `leadGeneration.generateLeads`
Generates and scores potential leads based on criteria.

**Input:**
```typescript
{
  industry?: string
  location?: string
  count: number  // 1-1000
  campaignId?: number
}
```

**Output:**
```typescript
{
  leads: Array<{
    companyName: string
    email: string
    industry: string
    location: string
    score: number  // 0-1
    contactName?: string
    phone?: string
    website?: string
  }>
}
```

---

## Communication Endpoints

### `communication.sendEmails`
Sends personalized emails to leads.

**Input:**
```typescript
{
  leadIds: number[]
  campaignId?: number
  senderEmail: string
}
```

**Output:**
```typescript
{
  success: boolean
}
```

---

## Decision Endpoints

### `decision.filterTopProspects`
Filters and ranks top prospects from a campaign.

**Input:**
```typescript
{
  campaignId: number
  topCount?: number  // default: 50
}
```

**Output:**
```typescript
{
  prospects: Array<{
    id: number
    companyName: string
    email: string
    score: number
    conversionProbability: number
    recommendation: string
  }>
}
```

---

## Reporting Endpoints

### `reporting.generateReport`
Generates comprehensive analytics report.

**Input:**
```typescript
{
  campaignIds: number[]
}
```

**Output:**
```typescript
{
  period: string
  totalCampaigns: number
  totalLeads: number
  totalEmailsSent: number
  totalEmailsOpened: number
  totalEmailsReplied: number
  totalMeetingsBooked: number
  overallOpenRate: number
  overallReplyRate: number
  overallConversionRate: number
  topCampaigns: Array<{
    campaignId: number
    campaignName: string
    totalLeads: number
    emailsSent: number
    emailsOpened: number
    emailsReplied: number
    meetingsBooked: number
    openRate: number
    replyRate: number
    conversionRate: number
    averageLeadScore: number
    topPerformingIndustries: string[]
    topPerformingLocations: string[]
  }>
  insights: string[]
}
```

---

## Email Routing Endpoints

### `emailRouting.classifyMessage`
Classifies an incoming message by audience type.

**Input:**
```typescript
{
  content: string
  subject?: string
}
```

**Output:**
```typescript
{
  classification: "ai_ml" | "mobile" | "ui_ux" | "general"
  confidence: number  // 0-1
  keywords: string[]
  reasoning: string
}
```

---

### `emailRouting.routeMessage`
Routes a message to the appropriate recipient.

**Input:**
```typescript
{
  senderEmail: string
  subject: string
  content: string
  leadId?: number
  campaignId?: number
}
```

**Output:**
```typescript
{
  messageId: number
  classification: "ai_ml" | "mobile" | "ui_ux" | "general"
  routedTo: string
  confidence: number
}
```

**Routing Rules:**
- **AI/ML** → haseeb.ejaz@rdexsolutions.com
- **Mobile** → ahsan.dev@rdexsolutions.com
- **UI/UX** → rayan.adam@rdexsolutions.com
- **General** → sales@rdexsolutions.com

---

### `emailRouting.batchRouteMessages`
Routes multiple messages in batch.

**Input:**
```typescript
{
  messages: Array<{
    senderEmail: string
    subject: string
    content: string
    leadId?: number
    campaignId?: number
  }>
}
```

**Output:**
```typescript
{
  results: Array<{
    messageId: number
    classification: "ai_ml" | "mobile" | "ui_ux" | "general"
    routedTo: string
    confidence: number
  }>
}
```

---

### `emailRouting.getRoutingRules`
Retrieves current routing rules.

**Output:**
```typescript
{
  rules: Array<{
    classification: "ai_ml" | "mobile" | "ui_ux" | "general"
    targetEmail: string
    keywords: string[]
  }>
}
```

---

## Data Retrieval Endpoints

### `data.getWorkflows`
Retrieves all workflows for the user.

**Output:**
```typescript
{
  workflows: Array<{
    id: number
    name: string
    status: string
    createdAt: Date
    updatedAt: Date
  }>
}
```

---

### `data.getCampaigns`
Retrieves all campaigns for the user.

**Output:**
```typescript
{
  campaigns: Array<{
    id: number
    name: string
    status: string
    emailsSent: number
    emailsOpened: number
    emailsReplied: number
    meetingsBooked: number
    createdAt: Date
    updatedAt: Date
  }>
}
```

---

### `data.getLeads`
Retrieves all leads for the user.

**Output:**
```typescript
{
  leads: Array<{
    id: number
    companyName: string
    email: string
    industry: string
    location: string
    score: string
    status: string
    createdAt: Date
    updatedAt: Date
  }>
}
```

---

### `data.getMessages`
Retrieves all messages for the user.

**Output:**
```typescript
{
  messages: Array<{
    id: number
    messageType: string
    source: string
    senderEmail: string
    recipientEmail: string
    subject: string
    content: string
    status: string
    createdAt: Date
    updatedAt: Date
  }>
}
```

---

### `data.getEmailRoutingConfig`
Retrieves email routing configuration.

**Output:**
```typescript
{
  config: Array<{
    id: number
    classification: string
    targetEmail: string
    keywords: string
  }>
}
```

---

## Authentication Endpoints

### `auth.me`
Gets current user information.

**Output:**
```typescript
{
  id: number
  openId: string
  name: string
  email: string
  role: "user" | "admin"
  createdAt: Date
  updatedAt: Date
  lastSignedIn: Date
}
```

---

### `auth.logout`
Logs out the current user.

**Output:**
```typescript
{
  success: boolean
}
```

---

## Error Handling

All endpoints return errors in the following format:

```typescript
{
  code: string  // TRPC error code
  message: string
  data?: any
}
```

Common error codes:
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User lacks permission
- `NOT_FOUND` - Resource not found
- `BAD_REQUEST` - Invalid input
- `INTERNAL_SERVER_ERROR` - Server error

---

## Rate Limiting

No rate limiting is currently implemented. Production deployments should add appropriate rate limiting.

---

## Webhook Support

Webhooks are not currently supported but can be added for real-time event notifications.
