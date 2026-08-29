import { pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core'

export const appData = pgTable(
  'app_data',
  {
    id: serial().primaryKey(),
    userId: text('user_id').notNull(),
    key: text().notNull(),
    value: text().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique('app_data_user_key_unique').on(table.userId, table.key)],
)
