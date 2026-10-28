# Wiz Timeline — macOS 原生风格研发团队排期与里程碑系统

[![Node.js](https://img.shields.io/badge/Node.js-v24.20.0-green.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org)
[![SQLite](https://img.shields.io/badge/Database-SQLite%203-003B57.svg)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

**Wiz Timeline** 是一款专为 **5–30 人研发团队**（如机器人算法、视觉感知、硬件集成、前端、QA 测试等）打造的轻量级人员任务排期与关键里程碑系统。

产品采用 **Resource Timeline / Person-based Gantt** 核心设计，以团队成员为纵轴，以真实日期为横轴，彻底回答三个关键工程问题：
1. **谁在负责什么任务？**
2. **具体从哪一天开始、哪一天结束？**
3. **什么时候需要完成关键里程碑？**

系统深度贯彻 Apple HIG 设计语言（参考 macOS Calendar、Reminders 与 Linear 的信息密度），采用 **Local-first** 单机持久化架构，开箱即用，零外部云端依赖，无任何收费组件。

---

## 📸 界面特色与视觉规范 (macOS Native Design)

- **原生质感**：大面积干净背景、浅灰微边框、极细 8px 网格间距系统，内置 Segoe UI 与 SF Pro 字体栈。
- **深浅色主题**：默认 Light Mode，支持通过右上角一键切换 Dark Mode，平滑过渡。
- **智能子轨道堆叠**：单人并行承接多项任务时，系统自动运行**区间着色贪心算法**分配独立子轨道，避免任务条遮挡覆盖，主行高度智能自适应。
- **实时拖拽交互**：
  - **水平拖拽**：调整起止日期（保持任务时长不变），实时吸附网格并显示日期浮层。
  - **垂直拖拽**：跨成员移动，自动重新分配任务负责人。
  - **边缘缩放**：左右手柄直接拖动缩放任务周期，防倒流边界约束。
  - **空白拖选**：在成员行空白时间段直接拖动鼠标，自动弹出预填选定日期区间的创建弹窗。
- **里程碑实体**：独立金色菱形标记（Diamond Marker），支持鼠标悬停浮动卡片、点击查看及沿时间轴自由拖动改期。
- **macOS Inspector 抽屉**：点击任务唤起右侧抽屉面板，实时修改标题、项目、人员、优先级、进度滑块（0–100%）、状态和分类颜色，删除二次确认保护。

---

## 🛠️ 环境要求

- **操作系统**：Windows 11 / Windows 10
- **运行环境**：Node.js LTS (已自动配置为 v24.20.0 或更高版本)
- **依赖工具**：npm (v11+)
- **浏览器**：Chrome / Edge / Safari / Firefox 最新版

---

## 🚀 快速启动指南

### 方式一：Windows 一键双击启动（推荐）

直接在工作区根目录双击运行脚本：

```text
.\start.bat
```

脚本将自动检查依赖、启动本地服务并在默认浏览器中自动打开：

👉 **http://localhost:3000**

---

### 方式二：命令行启动

在终端（PowerShell 或 CMD）中进入项目根目录：

```bash
# 1. 安装依赖（首次运行）
npm install

# 2. 启动开发服务器
npm run dev
```

启动完成后在浏览器访问：`http://localhost:3000`

---

## 🧪 自动化测试与质量检验

项目内置针对日期计算、任务重叠算法、数据库增删改查及端到端业务流的自动化测试：

```bash
# 运行全部自动化单元与集成测试
npm test

# 运行 TypeScript 严格类型检查
npm run typecheck

# 运行生产构建打包
npm run build
```

---

## 💾 数据存储与本地持久化机制

- **数据库类型**：本地 SQLite 数据库文件
- **存储文件路径**：`.\wiz_timeline.db`
- **驱动技术**：`@libsql/client` + `Drizzle ORM`（纯 Node/跨平台运行，无需本地编译 C++ 工具链，杜绝 node-gyp 兼容故障）。
- **初始化机制**：首次启动时自动建立表结构（`projects`, `members`, `tasks`, `milestones`），并智能注入完整的演示工程：
  - 演示项目：`Vision-Tactile Sensor V2.0`
  - 核心成员：Alex (Algorithm)、Ben (Hardware)、Chris (Frontend)、David (Testing)、Emma (Project Manager)
  - 任务规模：包含 Marker Detection, 3D Reconstruction, PCB Integration 等 14 项完整任务与 4 个关键交付里程碑，围绕首次运行日期交错展开。
- **防误覆盖**：种子数据仅在数据库为空时初始化一次，后续所有增删改查均实时落盘，刷新页面或重启服务不丢失数据。如需重新体验演示，可在左侧侧边栏底部点击 **Reset Demo Data**。

---

## 🗄️ 数据库备份与还原

### 备份数据库
SQLite 为单文件数据库，备份极其简便：
1. 关闭正在运行的服务（`Ctrl + C`）。
2. 直接复制根目录下的 `wiz_timeline.db` 文件至备份目录即可，例如：
   ```powershell
   Copy-Item "wiz_timeline.db" -Destination "wiz_timeline_backup_$(Get-Date -Format 'yyyyMMdd').db"
   ```

### 还原数据库
将备份文件改名覆盖为 `wiz_timeline.db` 后重新启动服务即可完整恢复。

---

## 📂 项目结构概览

```text
wiz-planner
├── docs/
│   └── ARCHITECTURE.md          # 详细系统架构与算法设计文档
├── src/
│   ├── app/
│   │   ├── api/                 # Next.js App Router REST API 接口
│   │   │   ├── projects/        # 项目列表与新建
│   │   │   ├── members/         # 成员列表与添加
│   │   │   ├── tasks/           # 任务 CRUD 与动态属性更新
│   │   │   ├── milestones/      # 里程碑 CRUD
│   │   │   └── seed/            # 演示种子数据重置接口
│   │   ├── globals.css          # macOS 原生风格全局样式与微滚动条
│   │   ├── layout.tsx           # 根布局与元数据配置
│   │   └── page.tsx             # 主页面 (侧边栏 + 工具栏 + 时间轴 + 抽屉)
│   ├── components/
│   │   ├── drawer/              # macOS 详情抽屉 (TaskDrawer)
│   │   ├── modals/              # 新建任务/里程碑/项目/成员弹窗
│   │   ├── sidebar/             # 侧边栏 (项目切换、团队概览)
│   │   ├── timeline/            # 核心时间轴组件 (Header, Row, TaskBar, Marker)
│   │   ├── toolbar/             # 顶部工具栏 (日/周/月切换, 缩放, 筛选, 搜索)
│   │   └── ui/                  # 基础控件 (Toast 消息通知系统)
│   └── lib/
│       ├── db/                  # SQLite 驱动、Drizzle Schema、自动建表与种子
│       ├── store/               # Zustand 乐观更新状态中心
│       ├── timeline/            # 日期纯函数库、重叠子轨道布局算法
│       └── validations.ts       # Zod 强类型数据校验模型
├── test/
│   ├── db.test.mjs              # 数据库初始化测试
│   ├── timeline.test.mjs        # 核心算法与日期纯函数测试
│   └── e2e-operations.test.mjs  # 完整业务流端到端验证测试
├── package.json                 # 依赖包与启动脚本定义
├── tsconfig.json                # TypeScript 严格模式配置
├── tailwind.config.ts           # Tailwind 色板与 macOS 设计系统配置
├── start.bat                    # Windows 一键启动脚本
└── README.md                    # 项目说明文档
```

---

## ❓ 常见问题排查 (FAQ)

1. **端口 3000 被占用怎么办？**
   若 3000 端口已被其他服务占用，可在命令行指定端口启动：
   ```bash
   npx next dev -p 3001
   ```

2. **如何切换视图范围？**
   在顶部工具栏的 Segmented Control 中可直接切换 **Day（日视图）**、**Week（周视图）**、**Month（月视图）**，并可通过滑块自由缩放列宽；点击 **Today** 按钮可一键定位回今天。

3. **如何在局域网内其他设备或手机上查看？**
   启动服务后，终端会输出局域网 IP（例如 `http://192.168.x.x:3000`），同一局域网下的其他电脑或平板在浏览器中输入该地址即可直接访问。

---

## 🚢 生产部署建议 (Production Deployment)

如需部署为团队内部常驻服务：
1. **本地生产构建**：运行 `npm run build`。
2. **生产守护运行**：使用 Windows 后台服务工具（如 PM2 或 NSSM）将 `npm start` 注册为 Windows 系统服务，即可实现开机自启与故障自愈。
3. **反向代理**：可通过 Nginx 配置反向代理至 `localhost:3000` 并配置 SSL 证书。

