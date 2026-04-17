# ABOA - Autonomous Business Operations Agent

A sophisticated multi-agent AI platform for orchestrating intelligent business workflows. ABOA decomposes natural language commands into coordinated agent tasks, automating lead generation, communication, decision-making, and reporting.

## 🎯 Project Overview

ABOA is a production-ready platform that combines:
- **Multi-Agent AI System**: 6 specialized agents working in coordination
- **Natural Language Interface**: Intuitive command center for workflow orchestration
- **Real-Time Monitoring**: Live workflow execution tracking
- **Advanced Analytics**: Comprehensive reporting and insights
- **Smart Email Routing**: LLM-based message classification and routing

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React Dashboard                       │
│  ┌──────────────┬──────────────┬──────────────────┐    │
│  │   Command    │   Workflow   │     Reports      │    │
│  │   Center     │   Monitor    │   Dashboard      │    │
│  └──────────────┴──────────────┴──────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                  tRPC API Layer                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│               Agent Orchestration System                │
│  ┌──────────┬─────────┬──────────┬────────┬──────────┐ │
│  │ Master   │  Lead   │Communication│Decision│Reporting│ │
│  │ Agent    │ Gen     │ Agent    │ Agent  │ Agent    │ │
│  └──────────┴─────────┴──────────┴────────┴──────────┘ │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Email Routing Agent (LLM Classification)     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Database Layer (MySQL/TiDB)               │
│  ┌────────┬────────┬──────────┬──────┬──────────────┐  │
│  │ Users  │ Tasks  │Workflows │Leads │ Campaigns    │  │
│  └────────┴────────┴──────────┴──────┴──────────────┘  │
│  ┌────────────────┬──────────────┬──────────────────┐  │
│  │   Messages     │ EmailRouting  │  AgentMemory     │  │
│  └────────────────┴──────────────┴──────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Features

### Master Agent
- Decomposes natural language commands into actionable steps
- Orchestrates sub-agent execution
- Manages workflow state and progress
- Provides estimated duration and dependencies

### Lead Generation Agent
- Discovers potential leads via web and API queries
- Scores leads based on quality indicators
- Extracts: company name, email, industry, location
- Stores leads with quality scores (0-1 scale)

### Communication Agent
- Generates personalized emails using LLM
- Sends emails to leads
- Tracks open and reply rates
- Schedules automatic follow-ups
- Manages email templates

### Decision Agent
- Ranks leads by conversion probability
- Filters top prospects from larger pools
- Optimizes outreach strategy
- Provides conversion recommendations

### Reporting Agent
- Generates comprehensive analytics dashboards
- Calculates KPIs: open rate, reply rate, conversion rate
- Identifies top performing industries and locations
- Provides actionable insights and recommendations

### Email Routing Agent
- Classifies incoming messages using LLM
- Routes to appropriate team members:
  - **AI/ML** → haseeb.ejaz@rdexsolutions.com
  - **Mobile** → ahsan.dev@rdexsolutions.com
  - **UI/UX** → rayan.adam@rdexsolutions.com
  - **General** → sales@rdexsolutions.com
- Tracks routing history and confidence scores

## 🎨 Dashboard Screens

### Command Center
- Natural language command input
- Real-time command decomposition
- Quick command templates
- Command history
- Workflow execution trigger

### Workflow Monitor
- Real-time workflow status display
- Agent step timeline with status indicators
- Progress percentage and estimated completion
- Dependency visualization
- Live updates (auto-refresh)

### Reports Dashboard
- Campaign selection and filtering
- Key metrics: emails sent, replies, meetings, conversion rate
- Email metrics bar chart
- Conversion rate trend line chart
- Lead score distribution pie chart
- Performance summary with progress bars
- AI-generated insights and recommendations

## 📊 Database Schema

### Users
- Core authentication and user management
- Role-based access control (user/admin)

### Tasks
- Individual workflow tasks
- Status tracking and metadata

### Workflows
- Workflow definitions and execution history
- Progress tracking and step management

### Leads
- Lead information and scoring
- Campaign association
- Status tracking

### Campaigns
- Campaign metadata
- Email metrics (sent, opened, replied)
- Meeting bookings

### Messages
- Email communication tracking
- Incoming and outgoing messages
- Routing information

### EmailRouting
- Routing rules configuration
- Classification settings
- Team member email mappings

### AgentMemory
- Short-term task state
- Long-term storage of commands and preferences
- Campaign results history

## 🔧 Technology Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Express 4 + tRPC 11 + Node.js
- **Database**: MySQL/TiDB with Drizzle ORM
- **AI/LLM**: Built-in Manus LLM API
- **Authentication**: Manus OAuth
- **Charts**: Recharts
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: React Query (TanStack Query)
- **Testing**: Vitest

## 📦 Project Structure

```
aboa-agent/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── CommandCenter.tsx   # Command orchestration
│   │   │   ├── WorkflowMonitor.tsx # Workflow tracking
│   │   │   └── ReportsDashboard.tsx# Analytics
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx # Main layout
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── lib/trpc.ts            # tRPC client
│   │   └── index.css              # Global styles
│   └── public/
├── server/                          # Express backend
│   ├── agents/
│   │   ├── masterAgent.ts          # Orchestration
│   │   ├── leadGenerationAgent.ts  # Lead discovery
│   │   ├── communicationAgent.ts   # Email handling
│   │   ├── decisionAgent.ts        # Lead ranking
│   │   ├── reportingAgent.ts       # Analytics
│   │   └── emailRoutingAgent.ts    # Message routing
│   ├── routers.ts                  # tRPC procedures
│   ├── db.ts                       # Database helpers
│   └── _core/                      # Framework code
├── drizzle/                         # Database schema
│   ├── schema.ts                   # Table definitions
│   └── migrations/                 # SQL migrations
├── shared/                          # Shared types
├── API_DOCUMENTATION.md            # API reference
├── USER_GUIDE.md                   # User documentation
└── README_ABOA.md                  # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- MySQL/TiDB database
- Manus account with OAuth credentials

### Installation

1. **Clone and Setup**
```bash
cd /home/ubuntu/aboa-agent
pnpm install
```

2. **Environment Variables**
Set up required environment variables (automatically injected by Manus):
- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: Session signing secret
- `VITE_APP_ID`: OAuth application ID
- `OAUTH_SERVER_URL`: OAuth backend URL
- `BUILT_IN_FORGE_API_KEY`: LLM API key
- `BUILT_IN_FORGE_API_URL`: LLM API URL

3. **Database Setup**
```bash
pnpm drizzle-kit generate  # Generate migrations
pnpm drizzle-kit migrate   # Apply migrations
```

4. **Development Server**
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

5. **Production Build**
```bash
pnpm build
pnpm start
```

## 📖 Usage

### Command Examples

**Generate Leads:**
```
"Find 100 restaurants in New York and score them by quality"
```

**Send Campaign:**
```
"Send personalized emails to top 50 leads and track responses"
```

**Analyze Results:**
```
"Generate report for all campaigns with insights"
```

**Route Messages:**
```
"Classify incoming message about AI/ML and route to appropriate team"
```

## 🔐 Email Routing Configuration

The system automatically routes messages based on content classification:

| Type | Target Email | Example Keywords |
|------|---|---|
| AI/ML | haseeb.ejaz@rdexsolutions.com | AI, machine learning, neural networks, LLM, GPT, NLP |
| Mobile | ahsan.dev@rdexsolutions.com | iOS, Android, mobile app, Flutter, React Native |
| UI/UX | rayan.adam@rdexsolutions.com | design, frontend, React, Vue, CSS, interface |
| General | sales@rdexsolutions.com | Other inquiries |

## 📊 API Reference

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

### Key Endpoints

- `masterAgent.decomposeCommand` - Analyze commands
- `masterAgent.createWorkflow` - Create workflows
- `masterAgent.monitorWorkflow` - Track execution
- `leadGeneration.generateLeads` - Generate leads
- `communication.sendEmails` - Send campaigns
- `decision.filterTopProspects` - Rank prospects
- `reporting.generateReport` - Get analytics
- `emailRouting.routeMessage` - Route messages

## 🧪 Testing

Run unit tests:
```bash
pnpm test
```

Run tests in watch mode:
```bash
pnpm test --watch
```

## 📝 Documentation

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference
- **[USER_GUIDE.md](./USER_GUIDE.md)** - User guide and workflows
- **[README_ABOA.md](./README_ABOA.md)** - This file

## 🎯 Key Metrics

ABOA tracks these performance indicators:

- **Lead Quality Score**: 0-1 rating of lead fit
- **Email Open Rate**: Percentage of emails opened
- **Reply Rate**: Percentage of emails with replies
- **Conversion Rate**: Percentage resulting in meetings
- **Campaign ROI**: Return on investment per campaign
- **Agent Efficiency**: Resources used per task

## 🔄 Workflow Execution

1. **Command Input**: User enters natural language command
2. **Decomposition**: Master Agent breaks down into steps
3. **Execution**: Sub-agents execute their tasks
4. **Monitoring**: Real-time progress tracking
5. **Reporting**: Analytics and insights generation
6. **Routing**: Messages classified and routed automatically

## 🛠️ Customization

### Add Custom Routing Rules
Edit `EmailRoutingAgent.defaultRoutingRules` to customize message classification.

### Modify Lead Scoring
Update `LeadGenerationAgent.scoreLead()` to adjust scoring logic.

### Customize Email Templates
Modify `CommunicationAgent.generateEmail()` for different email styles.

### Add New Agents
Create new agent file in `server/agents/` and register in `routers.ts`.

## 📈 Scaling Considerations

- Database: Use TiDB for horizontal scaling
- API: tRPC supports load balancing
- Agents: Can be run in parallel for large workloads
- Storage: S3 integration for file storage
- Caching: Redis for performance optimization

## 🐛 Troubleshooting

### Workflow Stuck
- Check Workflow Monitor for specific step status
- Verify database connectivity
- Review agent logs

### Low Lead Quality
- Adjust search criteria
- Review lead scoring logic
- Check data source quality

### Email Delivery Issues
- Verify email addresses
- Check sender reputation
- Review email content

## 📞 Support

For issues or questions:
1. Check documentation
2. Review API reference
3. Check workflow logs
4. Contact system administrator

## 📄 License

This project is proprietary and confidential.

## 🙏 Acknowledgments

Built with:
- Manus platform
- React and TypeScript
- tRPC for type-safe APIs
- Drizzle ORM for database
- shadcn/ui for components

---

**ABOA - Autonomous Business Operations Agent**
*Orchestrate intelligent workflows with AI-powered agents*
