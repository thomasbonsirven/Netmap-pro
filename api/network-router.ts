import { z } from "zod";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery } from "./middleware";
import { networks, devices, deviceConnections, deviceConfigs, scanJobs } from "@db/schema";
import { eq, like, and, or, desc, count } from "drizzle-orm";

export const networkRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(networks);
  }),

  get: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [network] = await db
        .select()
        .from(networks)
        .where(eq(networks.id, input.id));
      return network ?? null;
    }),

  create: publicQuery
    .input(
      z.object({
        name: z.string().min(1),
        cidr: z.string().min(1),
        gateway: z.string().optional(),
        vlan: z.number().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(networks).values({
        ...input,
        isActive: true,
      }).$returningId();
      return { id: result.id };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        cidr: z.string().optional(),
        gateway: z.string().optional(),
        vlan: z.number().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(networks).set(data).where(eq(networks.id, id));
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(networks).where(eq(networks.id, input.id));
      return { success: true };
    }),
});

export const deviceRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        search: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        networkId: z.number().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input.search) {
        conditions.push(
          or(
            like(devices.hostname, `%${input.search}%`),
            like(devices.ipAddress, `%${input.search}%`),
            like(devices.macAddress, `%${input.search}%`),
            like(devices.vendor, `%${input.search}%`)
          )
        );
      }
      if (input.type) {
        conditions.push(eq(devices.deviceType, input.type as typeof devices.$inferSelect.deviceType));
      }
      if (input.status) {
        conditions.push(eq(devices.status, input.status as typeof devices.$inferSelect.status));
      }
      if (input.networkId) {
        conditions.push(eq(devices.networkId, input.networkId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db
        .select()
        .from(devices)
        .where(whereClause)
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(desc(devices.lastSeen));

      const [countResult] = await db
        .select({ count: count() })
        .from(devices)
        .where(whereClause);

      return { items, total: countResult.count };
    }),

  get: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [device] = await db
        .select()
        .from(devices)
        .where(eq(devices.id, input.id));
      return device ?? null;
    }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const allDevices = await db.select().from(devices);
    const online = allDevices.filter((d) => d.status === "online").length;
    const offline = allDevices.filter((d) => d.status === "offline").length;
    const warning = allDevices.filter((d) => d.status === "warning").length;
    const scanning = allDevices.filter((d) => d.status === "scanning").length;

    const typeStats: Record<string, number> = {};
    allDevices.forEach((d) => {
      typeStats[d.deviceType] = (typeStats[d.deviceType] || 0) + 1;
    });

    return {
      total: allDevices.length,
      online,
      offline,
      warning,
      scanning,
      byType: typeStats,
    };
  }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        hostname: z.string().optional(),
        description: z.string().optional(),
        deviceType: z.enum(["router", "switch", "server", "workstation", "printer", "phone", "iot", "firewall", "access_point", "unknown"]).optional(),
        vendor: z.string().optional(),
        os: z.string().optional(),
        osVersion: z.string().optional(),
        x: z.number().optional(),
        y: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(devices).set(data).where(eq(devices.id, id));
      return { success: true };
    }),

  updatePosition: publicQuery
    .input(z.object({ id: z.number(), x: z.number(), y: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, x, y } = input;
      await db.update(devices).set({ x, y }).where(eq(devices.id, id));
      return { success: true };
    }),
});

export const topologyRouter = createRouter({
  getGraph: publicQuery.query(async () => {
    const db = getDb();
    const allDevices = await db.select().from(devices);
    const connections = await db.select().from(deviceConnections);

    const nodes = allDevices.map((d) => ({
      id: d.id,
      label: d.hostname || d.ipAddress,
      ip: d.ipAddress,
      type: d.deviceType,
      status: d.status,
      vendor: d.vendor,
      x: d.x ?? Math.random() * 800,
      y: d.y ?? Math.random() * 600,
    }));

    const links = connections.map((c) => ({
      source: c.sourceId,
      target: c.targetId,
      type: c.connectionType,
      bandwidth: c.bandwidth,
      status: c.status,
    }));

    return { nodes, links };
  }),
});

export const configRouter = createRouter({
  list: publicQuery
    .input(z.object({ deviceId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(deviceConfigs)
        .where(eq(deviceConfigs.deviceId, input.deviceId))
        .orderBy(deviceConfigs.category);
    }),

  create: publicQuery
    .input(
      z.object({
        deviceId: z.number(),
        configKey: z.string().min(1),
        configValue: z.string().optional(),
        configType: z.enum(["string", "number", "boolean", "json", "password"]).default("string"),
        category: z.string().optional(),
        isSensitive: z.boolean().default(false),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(deviceConfigs).values(input).$returningId();
      return { id: result.id };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        configKey: z.string().optional(),
        configValue: z.string().optional(),
        configType: z.enum(["string", "number", "boolean", "json", "password"]).optional(),
        category: z.string().optional(),
        isSensitive: z.boolean().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(deviceConfigs).set(data).where(eq(deviceConfigs.id, id));
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(deviceConfigs).where(eq(deviceConfigs.id, input.id));
      return { success: true };
    }),
});

export const scanRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(scanJobs)
      .orderBy(desc(scanJobs.createdAt));
  }),

  get: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [job] = await db
        .select()
        .from(scanJobs)
        .where(eq(scanJobs.id, input.id));
      return job ?? null;
    }),

  create: publicQuery
    .input(
      z.object({
        name: z.string().min(1),
        networkId: z.number().optional(),
        scanType: z.enum(["quick", "full", "custom"]).default("quick"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(scanJobs).values({
        ...input,
        status: "pending",
        totalHosts: input.networkId ? 254 : 24,
        scannedHosts: 0,
        foundDevices: 0,
      }).$returningId();
      return { id: result.id };
    }),

  simulateProgress: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [job] = await db
        .select()
        .from(scanJobs)
        .where(eq(scanJobs.id, input.id));
      
      if (!job || job.status !== "pending") return job;

      await db
        .update(scanJobs)
        .set({
          status: "running",
          startTime: new Date(),
        })
        .where(eq(scanJobs.id, input.id));

      return { id: input.id, status: "running" };
    }),

  complete: publicQuery
    .input(
      z.object({
        id: z.number(),
        foundDevices: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [job] = await db
        .select()
        .from(scanJobs)
        .where(eq(scanJobs.id, input.id));
      if (!job) return { success: false, error: "Job not found" };
      await db
        .update(scanJobs)
        .set({
          status: "completed",
          scannedHosts: job.totalHosts ?? 254,
          foundDevices: input.foundDevices,
          endTime: new Date(),
        })
        .where(eq(scanJobs.id, input.id));
      return { success: true };
    }),
});
