import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  bigint,
  json,
  boolean,
  float,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const networks = mysqlTable("networks", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cidr: varchar("cidr", { length: 50 }).notNull(),
  gateway: varchar("gateway", { length: 50 }),
  vlan: int("vlan"),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Network = typeof networks.$inferSelect;

export const devices = mysqlTable("devices", {
  id: serial("id").primaryKey(),
  ipAddress: varchar("ipAddress", { length: 50 }).notNull(),
  macAddress: varchar("macAddress", { length: 50 }),
  hostname: varchar("hostname", { length: 255 }),
  deviceType: mysqlEnum("deviceType", [
    "router",
    "switch",
    "server",
    "workstation",
    "printer",
    "phone",
    "iot",
    "firewall",
    "access_point",
    "unknown",
  ]).default("unknown").notNull(),
  vendor: varchar("vendor", { length: 255 }),
  os: varchar("os", { length: 255 }),
  osVersion: varchar("osVersion", { length: 255 }),
  status: mysqlEnum("status", ["online", "offline", "warning", "scanning"])
    .default("offline")
    .notNull(),
  lastSeen: timestamp("lastSeen").defaultNow(),
  firstSeen: timestamp("firstSeen").defaultNow().notNull(),
  responseTime: int("responseTime"),
  openPorts: json("openPorts").$type<number[]>(),
  networkId: bigint("networkId", { mode: "number", unsigned: true }),
  parentId: bigint("parentId", { mode: "number", unsigned: true }),
  x: float("x"),
  y: float("y"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Device = typeof devices.$inferSelect;

export const deviceConnections = mysqlTable("deviceConnections", {
  id: serial("id").primaryKey(),
  sourceId: bigint("sourceId", { mode: "number", unsigned: true }).notNull(),
  targetId: bigint("targetId", { mode: "number", unsigned: true }).notNull(),
  connectionType: mysqlEnum("connectionType", [
    "ethernet",
    "wifi",
    "fiber",
    "vpn",
    "unknown",
  ])
    .default("unknown")
    .notNull(),
  bandwidth: varchar("bandwidth", { length: 50 }),
  latency: int("latency"),
  status: mysqlEnum("status", ["active", "inactive", "degraded"])
    .default("active")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeviceConnection = typeof deviceConnections.$inferSelect;

export const deviceConfigs = mysqlTable("deviceConfigs", {
  id: serial("id").primaryKey(),
  deviceId: bigint("deviceId", { mode: "number", unsigned: true }).notNull(),
  configKey: varchar("configKey", { length: 255 }).notNull(),
  configValue: text("configValue"),
  configType: mysqlEnum("configType", [
    "string",
    "number",
    "boolean",
    "json",
    "password",
  ])
    .default("string")
    .notNull(),
  category: varchar("category", { length: 255 }),
  isSensitive: boolean("isSensitive").default(false).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type DeviceConfig = typeof deviceConfigs.$inferSelect;

export const scanJobs = mysqlTable("scanJobs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  networkId: bigint("networkId", { mode: "number", unsigned: true }),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"])
    .default("pending")
    .notNull(),
  scanType: mysqlEnum("scanType", ["quick", "full", "custom"])
    .default("quick")
    .notNull(),
  totalHosts: int("totalHosts"),
  scannedHosts: int("scannedHosts").default(0),
  foundDevices: int("foundDevices").default(0),
  startTime: timestamp("startTime"),
  endTime: timestamp("endTime"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScanJob = typeof scanJobs.$inferSelect;
