import express, { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---

// CORS: allow all origins for development
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

// --- Routes ---

// GET /api/users — return all users
app.get('/api/users', async (_req: Request, res: Response) => {
  try {
    const allUsers = await db.select().from(schema.users);
    res.json(allUsers);
  } catch (err) {
    console.error('GET /api/users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/skills?userId=<id> — return all skills for a specific user
app.get('/api/skills', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (typeof userId !== 'string' || !userId) {
      res.status(400).json({ error: 'userId query parameter is required' });
      return;
    }
    const userSkills = await db
      .select()
      .from(schema.skills)
      .where(eq(schema.skills.userId, userId));
    res.json(userSkills);
  } catch (err) {
    console.error('GET /api/skills error:', err);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// POST /api/skills — create a new skill (body matches the Skill interface)
app.post('/api/skills', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body?.userId || !body?.name || !body?.description || !body?.category || !body?.executionType) {
      res.status(400).json({
        error: 'Missing required fields: userId, name, description, category, executionType',
      });
      return;
    }
    const [created] = await db
      .insert(schema.skills)
      .values({
        userId: body.userId,
        name: body.name,
        description: body.description,
        category: body.category,
        executionType: body.executionType,
        status: body.status ?? 'active',
        version: body.version ?? '1.0.0',
        inputSchema: body.inputSchema ?? [],
        outputSchema: body.outputSchema ?? {},
        config: body.config ?? {},
        tags: body.tags ?? [],
        dependencies: body.dependencies ?? [],
        explanation: body.explanation ?? null,
      })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    console.error('POST /api/skills error:', err);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

// PUT /api/skills/:id — update an existing skill
app.put('/api/skills/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    if (!id) {
      res.status(400).json({ error: 'Skill id is required' });
      return;
    }
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const allowed = [
      'name', 'description', 'category', 'executionType', 'status', 'version',
      'inputSchema', 'outputSchema', 'config', 'tags', 'dependencies', 'explanation',
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    const [updated] = await db
      .update(schema.skills)
      .set(updates)
      .where(eq(schema.skills.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/skills/:id error:', err);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

// DELETE /api/skills/:id — delete a skill
app.delete('/api/skills/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Skill id is required' });
      return;
    }
    const [deleted] = await db
      .delete(schema.skills)
      .where(eq(schema.skills.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }
    res.json({ success: true, id });
  } catch (err) {
    console.error('DELETE /api/skills/:id error:', err);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
