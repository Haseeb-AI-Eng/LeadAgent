# ABOA Agent - Automated Business Outreach Automation

A powerful AI-driven agent system for automating lead generation, email outreach, and workflow management. Built with TypeScript, Vite, Express, and Groq LLM.

## 🚀 Features

- **Lead Generation Agent** - Automatically search for and extract business leads using web search
- **Communication Agent** - Generate personalized emails and send via SMTP with rate limiting
- **Decision Agent** - Filter and rank leads based on quality scores
- **Master Agent** - Orchestrate multi-step workflows from natural language commands
- **Reporting Agent** - Track campaign metrics and performance
- **Email Authentication** - SPF, DKIM support with SSL/TLS encryption
- **Real-time Workflow Monitoring** - Track campaign execution with live updates
- **Database Persistence** - MongoDB integration for leads, campaigns, and messages

## 📋 Prerequisites

- Node.js 18+
- npm or pnpm
- MongoDB (for data persistence)
- Groq API key (for LLM functionality)
- Tavily API key (for web search)
- SMTP server credentials (for email delivery)

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd aboa-agent
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
OAUTH_SERVER_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_here

# Database
MONGODB_URL=mongodb://localhost:27017
MONGODB_NAME=game

# LLM Configuration
LLM_PROVIDER=groq
LLM_TIMEOUT_MS=30000
GROQ_API_URL=https://api.groq.com/openai
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_API_KEY=your_groq_api_key_here

# Web Search
TAVILY_API_KEY=your_tavily_api_key_here

# Email/SMTP Configuration
SMTP_HOST=mail.rdexsolutions.com
SMTP_PORT=465
SMTP_USER=your_email@domain.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_NAME=Your Company Name
DEFAULT_SENDER_EMAIL=noreply@domain.com
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

This starts the server with hot reload and opens the development environment at `http://localhost:3000`.

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

### Type Checking
```bash
npm run check
```

### Format Code
```bash
npm run format
```

### Run Tests
```bash
npm test
```

## 📦 Project Structure

```
aboa-agent/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React contexts
│   │   └── App.tsx         # Main app component
│   └── index.html          # Entry point
├── server/                 # Backend Node.js server
│   ├── agents/             # AI agents (lead, communication, decision, etc.)
│   ├── _core/              # Core functionality
│   │   ├── llm.ts          # Groq LLM integration
│   │   ├── dataApi.ts      # Tavily web search
│   │   ├── context.ts      # Request context
│   │   └── env.ts          # Environment configuration
│   ├── db.ts               # Database operations
│   ├── routers.ts          # tRPC API routes
│   └── storage.ts          # File storage utilities
├── shared/                 # Shared types and constants
├── drizzle/                # Database migrations
└── package.json            # Project dependencies
```

## 🤖 Agents Overview

### Lead Generation Agent
Automatically searches the web and extracts business leads based on criteria:
- Industry filtering
- Location targeting
- Email validation
- Domain reputation checks

```typescript
const leads = await leadGenerationAgent.generateLeads({
  industry: "technology",
  location: "New York",
  count: 5
});
```

### Communication Agent
Sends personalized emails with built-in rate limiting:
- AI-generated personalized emails
- 3-second delay between sends
- Email validation before sending
- SMTP with SSL/TLS support

```typescript
await communicationAgent.executeCommunication({
  leadIds: [1, 2, 3],
  campaignId: 123,
  senderEmail: "sales@company.com"
});
```

### Decision Agent
Ranks and filters leads based on quality:
- Lead scoring
- Filtering by criteria
- Top prospect selection

### Master Agent
Orchestrates complex workflows from natural language:
- Command parsing
- Workflow decomposition
- Multi-agent execution
- Step dependency management

## 📊 API Routes

### Lead Generation
- `POST /api/leadGeneration.generateLeads` - Generate leads
- **Input**: `{ industry?, location?, count, campaignId? }`

### Communication
- `POST /api/communication.sendEmails` - Send emails to leads
- **Input**: `{ leadIds[], campaignId?, senderEmail?, senderEmails? }`

### Decision
- `POST /api/decision.filterTopProspects` - Filter top leads
- **Input**: `{ campaignId, topCount? }`

### Reporting
- `POST /api/reporting.generateReport` - Generate campaign report
- **Input**: `{ campaignId }`

### Workflow
- `POST /api/system.createWorkflowFromCommand` - Create workflow from command
- **Input**: `{ command }`
- `POST /api/system.executeWorkflow` - Execute workflow
- **Input**: `{ workflowId }`
- `POST /api/system.monitorWorkflow` - Monitor workflow status
- **Input**: `{ workflowId }`

## 🔐 Email Delivery Best Practices

### Configuration
1. Ensure SMTP credentials are correct (port 465 for SSL, 587 for TLS)
2. Verify SPF, DKIM, DMARC records are configured
3. Add domain to whitelist if using shared SMTP

### Troubleshooting
- **"Payload Too Large"** - Token limits are now capped at 2000 per request (fixed)
- **"Recipient Not Found"** - Verify email address exists on recipient server
- **"Access Denied"** - Mail server rejected email; check domain reputation
- **Emails marked as spam** - Use personalization, avoid marketing language

### Email Extraction Strategy
The system now:
- Prefers personal emails (hello@, support@, sales@)
- Avoids generic emails (contact@, admin@)
- Filters blocked domains (reddit, gov, etc.)
- Validates format before sending
- Spaces sends 3 seconds apart to avoid rate limiting

## 📈 Monitoring & Logs

### Workflow Monitoring
Access the workflow monitor at `/workflow-monitor` to see real-time campaign execution:
- Step-by-step progress
- Success/failure status
- Email sent counts
- Quick links to webmail

### Log Output
All agents log their operations:
```
[LeadGenerationAgent] Starting lead generation...
[CommunicationAgent] Sending email to hello@company.com...
[MasterAgent] Processing command: ...
```

## 🔧 Configuration Files

- `vite.config.ts` - Vite build configuration
- `vitest.config.ts` - Test configuration
- `tsconfig.json` - TypeScript configuration
- `drizzle.config.ts` - Database migration config
- `.env` - Environment variables (not in git)

## 📚 Additional Documentation

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Detailed API reference
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment guide
- [WEBMAIL_VERIFICATION_GUIDE.md](./WEBMAIL_VERIFICATION_GUIDE.md) - Email verification steps
- [USER_GUIDE.md](./USER_GUIDE.md) - User manual
- [EMAIL_DELIVERY_FIXES.md](./EMAIL_DELIVERY_FIXES.md) - Email delivery improvements
- [FIXES_APPLIED.md](./FIXES_APPLIED.md) - Technical fixes and optimizations

## 🐛 Troubleshooting

### Build Errors
```bash
npm run check  # Type check
npm run build  # Full build
```

### Database Issues
```bash
npm run db:push  # Create/migrate database schema
```

### Port Already in Use
```bash
# Change port in server configuration or kill existing process
lsof -i :3000  # List processes on port 3000
```

## 🚀 Performance Optimization

Recent optimizations applied:
- **Token Limits** - Reduced from 32,768 to 2,000 per request (60x improvement)
- **Email Rate Limiting** - 3-second delays prevent spam filters
- **Lead Filtering** - Blocks 20+ problematic domain types
- **Email Validation** - Prevents sending to invalid addresses
- **Batch Processing** - Maximum 5 leads per batch

## 📝 License

MIT

## 🤝 Support

For issues or questions:
1. Check the troubleshooting guides
2. Review logs for error messages
3. Verify environment configuration
4. Check API documentation

## 🎯 Next Steps

1. Configure your environment variables
2. Start the development server: `npm run dev`
3. Access the UI at `http://localhost:3000`
4. Create a campaign from the dashboard
5. Monitor execution in the workflow monitor

---

**Built with:**
- React 19 + TypeScript
- Express + tRPC
- Groq LLM API
- Tavily Web Search
- MongoDB
- Tailwind CSS
- Vite + Vitest
