import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './index';
import { users, skills } from './schema';

const OWNER_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

const OWNER = {
  id: OWNER_ID,
  name: 'Abdulrahman Farid',
  email: '[REDACTED_EMAIL]',
  role: 'Developer',
};

const SEED_SKILLS = [
  {
    name: 'Web Search Fetcher',
    description: 'Performs a web search query and returns the top ranked results with snippets.',
    category: 'Search',
    executionType: 'API call',
    status: 'active',
    version: '1.2.0',
    inputSchema: [
      { name: 'query', type: 'string', required: true, description: 'Search query text', exampleValue: 'latest AI news' },
      { name: 'maxResults', type: 'number', required: false, description: 'Max results to return', defaultValue: 10 },
    ],
    outputSchema: { type: 'array', description: 'List of search result objects' },
    config: { timeoutMs: 8000, retryPolicy: { maxRetries: 3, backoffMs: 500 } },
    tags: ['search', 'web'],
    dependencies: [],
    explanation: 'Wraps a search API with retry and timeout handling.',
  },
  {
    name: 'Weather Lookup',
    description: 'Fetches current weather conditions for a given city.',
    category: 'Data Retrieval',
    executionType: 'API call',
    status: 'active',
    version: '1.0.3',
    inputSchema: [
      { name: 'city', type: 'string', required: true, description: 'City name', exampleValue: 'Cairo' },
      { name: 'units', type: 'string', required: false, description: 'metric or imperial', enumOptions: ['metric', 'imperial'], defaultValue: 'metric' },
    ],
    outputSchema: { type: 'object', description: 'Weather conditions object' },
    config: { timeoutMs: 5000, retryPolicy: { maxRetries: 2, backoffMs: 300 } },
    tags: ['weather', 'api'],
    dependencies: [],
    explanation: 'Simple REST lookup with unit conversion.',
  },
  {
    name: 'PDF Text Extractor',
    description: 'Extracts plain text content from a PDF document URL.',
    category: 'Document Processing',
    executionType: 'Python module',
    status: 'active',
    version: '2.1.0',
    inputSchema: [
      { name: 'pdfUrl', type: 'string', required: true, description: 'URL of the PDF file', exampleValue: 'https://example.com/report.pdf' },
      { name: 'pages', type: 'array', required: false, description: 'Specific pages to extract' },
    ],
    outputSchema: { type: 'string', description: 'Extracted plain text' },
    config: { timeoutMs: 30000, retryPolicy: { maxRetries: 1, backoffMs: 1000 } },
    tags: ['pdf', 'extraction'],
    dependencies: ['Web Search Fetcher'],
    explanation: 'Uses pdfplumber under the hood.',
  },
  {
    name: 'Sentiment Analyzer',
    description: 'Classifies text sentiment as positive, negative, or neutral with a confidence score.',
    category: 'AI / ML',
    executionType: 'Python module',
    status: 'active',
    version: '1.4.2',
    inputSchema: [
      { name: 'text', type: 'string', required: true, description: 'Text to analyze', exampleValue: 'I love this product!' },
      { name: 'language', type: 'string', required: false, description: 'ISO language code', defaultValue: 'en' },
    ],
    outputSchema: {
      type: 'object',
      description: 'Sentiment result',
      properties: [
        { name: 'label', type: 'string', description: 'positive | negative | neutral' },
        { name: 'confidence', type: 'number', description: '0-1 confidence score' },
      ],
    },
    config: { timeoutMs: 10000, retryPolicy: { maxRetries: 2, backoffMs: 400 } },
    tags: ['nlp', 'sentiment'],
    dependencies: [],
    explanation: 'Fine-tuned transformer classifier.',
  },
  {
    name: 'Currency Converter',
    description: 'Converts an amount between currencies using live exchange rates.',
    category: 'Finance',
    executionType: 'API call',
    status: 'active',
    version: '1.1.0',
    inputSchema: [
      { name: 'amount', type: 'number', required: true, description: 'Amount to convert', exampleValue: 100 },
      { name: 'from', type: 'string', required: true, description: 'Source currency code', exampleValue: 'USD' },
      { name: 'to', type: 'string', required: true, description: 'Target currency code', exampleValue: 'EGP' },
    ],
    outputSchema: { type: 'number', description: 'Converted amount' },
    config: { timeoutMs: 6000, retryPolicy: { maxRetries: 3, backoffMs: 500 } },
    tags: ['finance', 'currency'],
    dependencies: [],
    explanation: 'Caches rates for 5 minutes.',
  },
  {
    name: 'Email Notifier',
    description: 'Sends a transactional email notification to one or more recipients.',
    category: 'Communication',
    executionType: 'API call',
    status: 'draft',
    version: '0.9.0',
    inputSchema: [
      { name: 'to', type: 'array', required: true, description: 'Recipient email addresses', exampleValue: ['user@example.com'] },
      { name: 'subject', type: 'string', required: true, description: 'Email subject', exampleValue: 'Build finished' },
      { name: 'body', type: 'string', required: true, description: 'Email body (HTML allowed)' },
    ],
    outputSchema: { type: 'object', description: 'Delivery receipt' },
    config: { timeoutMs: 15000, retryPolicy: { maxRetries: 2, backoffMs: 800 } },
    tags: ['email', 'notification'],
    dependencies: [],
    explanation: 'Draft skill pending rate-limit configuration.',
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is missing from the environment (.env). Aborting seed.');
    process.exit(1);
  }

  // 1. Upsert the fixed-uuid owner user (idempotent)
  await db.insert(users).values(OWNER).onConflictDoNothing();
  console.log('User: ensured owner user (Abdulrahman Farid).');

  const [owner] = await db.select().from(users).where(eq(users.id, OWNER_ID)).limit(1);
  if (!owner) {
    console.error('Owner user not found after upsert. Aborting.');
    process.exit(1);
  }

  // 2. Idempotently insert skills (skip ones already present for this user by name)
  const existing = await db
    .select({ name: skills.name })
    .from(skills)
    .where(eq(skills.userId, owner.id));
  const existingNames = new Set(existing.map((s) => s.name));

  let inserted = 0;
  let skipped = 0;
  for (const skill of SEED_SKILLS) {
    if (existingNames.has(skill.name)) {
      skipped++;
      continue;
    }
    await db
      .insert(skills)
      .values({
        userId: owner.id,
        name: skill.name,
        description: skill.description,
        category: skill.category,
        executionType: skill.executionType,
        status: skill.status,
        version: skill.version,
        inputSchema: skill.inputSchema,
        outputSchema: skill.outputSchema,
        config: skill.config,
        tags: skill.tags,
        dependencies: skill.dependencies,
        explanation: skill.explanation,
      })
      .onConflictDoNothing();
    inserted++;
  }
  console.log(`Skills: inserted ${inserted}, skipped ${skipped} (already present).`);
}

main()
  .then(() => {
    console.log('Seed completed successfully.');
    return db.$client.end();
  })
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('Seed failed:', err);
    try { await db.$client.end(); } catch { /* ignore */ }
    process.exit(1);
  });
