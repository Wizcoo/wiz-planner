# Wiz Timeline — 架构设计文档 (Architecture Document)

## 1. 架构概览 (System Overview)

Wiz Timeline 是一个专为 5–30 人研发团队打造的轻量级人员任务排期与关键里程碑系统（Resource Timeline / Person-based Gantt）。系统采用 **Local-first** 架构，优先保障本地快速响应、低延迟交互与无外部依赖的数据持久化。

```
┌────────────────────────────────────────────────────────┐
│                   Browser Client (UI)                  │
│  - macOS Native Style (Calendar / Reminders / Linear)  │
│  - React 19 + TypeScript + Tailwind CSS               │
│  - Zustand Store (Optimistic Updates + Client State)  │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (Next.js App Router)
┌───────────────────────────▼────────────────────────────┐
│                 Next.js API Layer (Server)             │
│  - Zod Request Schema Validation                       │
│  - Strict Date-only (YYYY-MM-DD) Handlers              │
│  - Error Handling & HTTP Status Standards              │
└───────────────────────────┬────────────────────────────┘
                            │ Drizzle ORM
┌───────────────────────────▼────────────────────────────┐
│                 SQLite Local Database                  │
│  - @libsql/client (Pure Node / Native Cross-platform)  │
│  - Projects, Members, Tasks, Milestones Tables         │
│  - Foreign Keys & Cascade Deletion                     │
└────────────────────────────────────────────────────────┘
```

---

## 2. 核心技术选型 (Technology Stack)

| 层次 | 技术选型 | 决策依据 |
| :--- | :--- | :--- |
| **框架** | Next.js 15 (App Router) | 模块化结构、API 路由原生支持、高性能服务端打包 |
| **语言** | TypeScript (Strict) | 强类型约束，消除日期计算与状态管理潜在缺陷 |
| **样式与主题** | Tailwind CSS + macOS Tokens | 精确控制 8px 网格间距、毛玻璃效果、柔和阴影、深浅色模式切换 |
| **状态管理** | Zustand | 轻量透明、原子状态解耦、原生支持乐观更新（Optimistic Updates）与回滚 |
| **日期处理** | date-fns | 纯函数、轻量化，杜绝跨时区偏移，严格按日历日计算 |
| **数据持久化** | SQLite + Drizzle ORM | 单机无外部依赖、免配置、零成本、事务可靠性强 |
| **SQLite 驱动** | `@libsql/client` | Windows 跨平台兼容性极佳，无需编译 C++ 本地插件，开箱即用 |
| **数据验证** | Zod | 强类型数据校验，前后端统一数据契约 |

---

## 3. 核心算法：子轨道贪心打包 (Sub-track Lane Allocation Algorithm)

在传统的甘特图中，纵轴是任务，横轴是时间。而在 **Resource Timeline** 中，纵轴是**团队成员**，同一个成员在相同时间段内可能承接多项并行任务。

为了防止任务块相互遮挡覆盖，同时最大化利用纵向屏幕空间，Wiz Timeline 实现了基于区间调度的贪心着色算法：

```typescript
export function assignLanesToTasks(tasks: Task[]): {
  taskLanes: Map<string, number>;
  totalLanes: number;
}
```

### 算法逻辑：
1. **排序**：将成员名下的所有任务按照 `startDate` 升序排列；若起始日期相同，则按持续时间由大到小排序。
2. **复用轨道**：维护一个轨道列表 `lanesEndDates`，记录当前各轨道最右端任务的结束日期。
3. **贪心放置**：遍历每一个任务，寻找第一个满足 `task.startDate > lanesEndDates[i]` 的子轨道（即不重叠）。
   - 若找到，将该任务分配给轨道 `i`，并将该轨道的结束日期更新为当前任务的 `endDate`。
   - 若所有现有轨道均与当前任务冲突，则新增子轨道 `lanesEndDates.length`。
4. **动态高度**：成员主行的高度由其实际分配的子轨道数决定：
   `rowHeight = Math.max(minRowHeight, topPadding + totalLanes * (taskHeight + taskGap) + bottomPadding)`

这一算法保证了：
- 互不冲突的任务在同一子轨道上排列，节省空间；
- 冲突任务优雅堆叠，绝不重叠；
- 拖拽和调整任务时间时，轨道自动实时重新计算，平滑适应。

---

## 4. 日期语义与时区防偏移策略 (Date-only Semantics)

在跨时区或本地环境开发排期应用时，常规的 JavaScript `new Date("2026-10-10")` 会将其解析为 UTC 午夜，再转换为本地时区时可能会变成前一天的 `23:00`，造成时间轴整体错位 1 天的典型 bug。

### 解决方案：
- 采用严格的 `YYYY-MM-DD` 纯字符串作为持久化存储和传输格式。
- 自定义 `parseDateOnly(dateStr)` 工具函数：
  ```typescript
  export function parseDateOnly(dateStr: string): Date {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d); // 本地时间 00:00:00，无时区漂移
  }
  ```
- 任务时长采用**闭区间语义**（包含当天）：
  `durationDays = differenceInCalendarDays(endDate, startDate) + 1`

---

## 5. 交互设计与乐观更新 (Optimistic UI Architecture)

为了实现 macOS 本地原生应用般丝滑的拖拽手感（~120fps），系统采用前端状态优先的乐观更新策略：

1. **水平拖拽**：实时修改起止日期并触发视觉重排；松手时发送 `PUT /api/tasks/[id]`。若网络异常，Zustand 自动回滚并弹出 Toast 告警。
2. **垂直拖拽（跨成员分配）**：拖拽至其他成员的行上时，通过 `document.elementsFromPoint` 检测目标成员，松手后更新 `assigneeId`。
3. **边缘缩放（Resize Handles）**：左右控制手柄可调整开始或结束时间，内置 `startDate <= endDate` 防倒流校验。
4. **详情抽屉（Inspector Drawer）**：修改字段时在输入失焦或选择时自动保存，无需多余的“提交”按钮。

---

## 6. 后续演进路线 (Future Roadmap)

- **多人在线协作**：可引入 WebSocket 或 Server-Sent Events (SSE) 广播数据更新。
- **权限管理与多租户**：底层数据结构已预留 `projectId` 和成员角色，未来可无缝引入基于 RBAC 的团队权限模型。
- **导入与导出**：可扩展支持 Excel / CSV / JSON 导出排期表与甘特图快照。
