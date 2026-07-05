import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const colorHysteresisResults = pgTable('color_hysteresis_results', {
  id: serial('id').primaryKey(),
  forwardSwitch: integer('forward_switch').notNull(),
  backwardSwitch: integer('backward_switch').notNull(),
  directionFirst: text('direction_first').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const colorHysteresisPollVotes = pgTable('color_hysteresis_poll_votes', {
  id: serial('id').primaryKey(),
  theory: text('theory').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
