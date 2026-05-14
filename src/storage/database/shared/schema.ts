import { pgTable, serial, varchar, integer, boolean, timestamp, text, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 应用表 - 按包名管理App
export const apps = pgTable(
	"apps",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		name: varchar("name", { length: 128 }).notNull(),              // 应用名称
		package_name: varchar("package_name", { length: 255 }).notNull().unique(), // 包名（唯一）
		media_id: varchar("media_id", { length: 64 }),                  // 穿山甲媒体ID
		level: integer("level").notNull().default(4),                   // 当前广告等级 0-4
		status: varchar("status", { length: 20 }).notNull().default("active"), // 状态
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("apps_package_name_idx").on(table.package_name),
		index("apps_status_idx").on(table.status),
	]
);

// 广告位配置表 - 每个App下的广告位
export const adSlots = pgTable(
	"ad_slots",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		app_id: varchar("app_id", { length: 36 }).notNull().references(() => apps.id, { onDelete: "cascade" }),
		slot_name: varchar("slot_name", { length: 64 }).notNull(),       // 广告位类型标识: openScreenId, bannerId, IncentiveVideoId, newInsertFullScreenId
		slot_label: varchar("slot_label", { length: 64 }).notNull(),     // 显示名称
		ad_slot_id: varchar("ad_slot_id", { length: 64 }),               // 广告位ID（穿山甲的slot_id/rit_id）
		platform: integer("platform").notNull().default(0),              // 0=iOS, 1=Android, 2=全平台
		enabled: boolean("enabled").notNull().default(true),             // 是否启用
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("ad_slots_app_id_idx").on(table.app_id),
		index("ad_slots_slot_name_idx").on(table.slot_name),
	]
);

// 用户表 - 管理后台用户
export const users = pgTable(
	"users",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		username: varchar("username", { length: 64 }).notNull().unique(),    // 用户名（唯一）
		password_hash: varchar("password_hash", { length: 255 }).notNull(),  // 密码hash
		display_name: varchar("display_name", { length: 64 }),               // 显示名称
		role: varchar("role", { length: 20 }).notNull().default("viewer"),   // 角色: admin / operator / viewer
		status: varchar("status", { length: 20 }).notNull().default("active"), // 状态: active / disabled
		last_login_at: timestamp("last_login_at", { withTimezone: true }),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("users_username_idx").on(table.username),
		index("users_role_idx").on(table.role),
	]
);

// 广告配置请求日志表 - 保存24小时
export const adConfigLogs = pgTable(
	"ad_config_logs",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		request_id: varchar("request_id", { length: 64 }).notNull(),       // 请求ID
		app_id: varchar("app_id", { length: 255 }).notNull(),              // 请求的包名
		channel: varchar("channel", { length: 64 }),                        // 渠道
		nonce: varchar("nonce", { length: 64 }),                            // nonce
		response_code: integer("response_code").notNull(),                  // 响应code
		response_msg: varchar("response_msg", { length: 255 }),             // 响应msg
		level: integer("level"),                                            // 返回的level
		slot_count: integer("slot_count").notNull().default(0),            // 返回的广告位数
		ip: varchar("ip", { length: 64 }),                                  // 请求IP
		user_agent: varchar("user_agent", { length: 512 }),                 // User-Agent
		latency_ms: integer("latency_ms"),                                  // 响应耗时(ms)
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("ad_config_logs_created_at_idx").on(table.created_at),
		index("ad_config_logs_app_id_idx").on(table.app_id),
		index("ad_config_logs_response_code_idx").on(table.response_code),
	]
);

// 广告等级配置表 - 每个Level包含哪些广告位
export const adLevels = pgTable(
	"ad_levels",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		level: integer("level").notNull().unique(),                      // 等级编号 0-4
		name: varchar("name", { length: 64 }).notNull(),                 // 等级名称
		description: text("description"),                                 // 等级说明
		is_default: boolean("is_default").notNull().default(false),       // 是否为默认等级
		open_screen: boolean("open_screen").notNull().default(false),     // 开屏广告
		banner: boolean("banner").notNull().default(false),               // Banner广告
		incentive_video: boolean("incentive_video").notNull().default(false), // 激励视频
		insert_full_screen: boolean("insert_full_screen").notNull().default(false), // 插屏全屏
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("ad_levels_level_idx").on(table.level),
	]
);
