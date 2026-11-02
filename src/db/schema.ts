import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('Developer'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const skills = pgTable('skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  executionType: text('execution_type').notNull(),
  status: text('status').notNull().default('active'),
  version: text('version').notNull().default('1.0.0'),
  inputSchema: jsonb('input_schema').notNull().default(sql`'[]'::jsonb`),
  outputSchema: jsonb('output_schema').notNull().default(sql`'{}'::jsonb`),
  config: jsonb('config').notNull().default(sql`'{}'::jsonb`),
  tags: text('tags').array().notNull().default([]),
  dependencies: text('dependencies').array().notNull().default([]),
  explanation: text('explanation'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
