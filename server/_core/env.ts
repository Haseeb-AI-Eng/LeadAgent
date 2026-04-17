export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  defaultSenderEmail: process.env.DEFAULT_SENDER_EMAIL ?? "noreply@aboa.local",
  isProduction: process.env.NODE_ENV === "production",
  llmProvider: process.env.LLM_PROVIDER ?? "groq",
  llmTimeoutMs: Number.parseInt(process.env.LLM_TIMEOUT_MS ?? "30000", 10),
  groqApiUrl:
    process.env.GROQ_API_URL ??
    process.env.BUILT_IN_FORGE_API_URL ??
    process.env.FORGE_API_URL ??
    "https://api.groq.com/openai",
  groqApiKey:
    process.env.GROQ_API_KEY ??
    process.env.FORGE_API_KEY ??
    process.env.BUILT_IN_FORGE_API_KEY ??
    process.env.OPENAI_API_KEY ??
    "",
  groqModel: process.env.GROQ_MODEL ?? "mixtral-8x7b-32768",
  forgeApiUrl:
    process.env.BUILT_IN_FORGE_API_URL ?? process.env.FORGE_API_URL ?? "",
  forgeApiKey:
    process.env.BUILT_IN_FORGE_API_KEY ?? process.env.OPENAI_API_KEY ?? process.env.FORGE_API_KEY ?? "",
  tavilyApiKey: process.env.TAVILY_API_KEY ?? "",
  // SMTP Configuration for email sending
  SMTP_HOST: process.env.SMTP_HOST ?? "",
  SMTP_PORT: process.env.SMTP_PORT ?? "587",
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD ?? "",
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME ?? "Rdex Solutions",
};
