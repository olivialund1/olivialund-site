import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const colorHysteresisResults = pgTable('color_hysteresis_results', {
  id: serial('id').primaryKey(),
  forwardSwitch: integer('forward_switch').notNull(),
  backwardSwitch: integer('backward_switch').notNull(),
  directionFirst: text('direction_first').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
