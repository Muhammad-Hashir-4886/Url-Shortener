import { relations, sql } from 'drizzle-orm';
import { int, mysqlTable, timestamp, varchar, boolean, text } from 'drizzle-orm/mysql-core';

export const usersTable = mysqlTable('users', {
  id: int().autoincrement().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  isEmailValid: boolean("is_email_valid").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const linksTable = mysqlTable("links", {
  id: int().autoincrement().primaryKey(),
  shortCode: varchar({length: 25}).notNull().unique(),
  url: varchar({length: 255}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  userId: int().notNull().references(() => usersTable.id)
});

export const sessionsTable = mysqlTable("sessions", {
  id: int().autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id, 
  {onDelete: 'cascade'}),
  valid: boolean().default(true).notNull(),
  deviceId: varchar("device_id", { length: 255 }), // For tracking multiple devices
  deviceName: varchar("device_name", { length: 255 }),
  platform: varchar({ length: 50 }), // 'ios', 'android', 'web'
  ip: varchar({length: 255}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// A user can have many short links & sessions
export const userRelation = relations(usersTable, ({many}) => ({
  links: many(linksTable),
  sessions: many(sessionsTable)
}));
// A short link belongs to one user 
export const linksRelation = relations(linksTable, ({one}) => ({
  user: one(usersTable, {
    fields: [linksTable.userId], //foreign key
    references: [usersTable.id],
  })
}));
//A session belongs to only one user
export const sessionRelation = relations(sessionsTable, ({one}) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId], //foreign key
    references: [usersTable.id],
  })
}));