import { relations } from "drizzle-orm";
import { networks, devices, deviceConnections, deviceConfigs, scanJobs } from "./schema";

export const networksRelations = relations(networks, ({ many }) => ({
  devices: many(devices),
  scanJobs: many(scanJobs),
}));

export const devicesRelations = relations(devices, ({ one, many }) => ({
  network: one(networks, {
    fields: [devices.networkId],
    references: [networks.id],
  }),
  parent: one(devices, {
    fields: [devices.parentId],
    references: [devices.id],
    relationName: "parent",
  }),
  children: many(devices, { relationName: "parent" }),
  configs: many(deviceConfigs),
  outgoingConnections: many(deviceConnections, { relationName: "source" }),
  incomingConnections: many(deviceConnections, { relationName: "target" }),
}));

export const deviceConnectionsRelations = relations(deviceConnections, ({ one }) => ({
  source: one(devices, {
    fields: [deviceConnections.sourceId],
    references: [devices.id],
    relationName: "source",
  }),
  target: one(devices, {
    fields: [deviceConnections.targetId],
    references: [devices.id],
    relationName: "target",
  }),
}));

export const deviceConfigsRelations = relations(deviceConfigs, ({ one }) => ({
  device: one(devices, {
    fields: [deviceConfigs.deviceId],
    references: [devices.id],
  }),
}));

export const scanJobsRelations = relations(scanJobs, ({ one }) => ({
  network: one(networks, {
    fields: [scanJobs.networkId],
    references: [networks.id],
  }),
}));
