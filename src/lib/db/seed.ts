import { db, ensureDbInitialized } from "./index.ts";
import { projects, members, tasks, milestones } from "./schema.ts";
import { format, addDays, subDays } from "date-fns";

export async function seedDemoDataIfNeeded(force = false) {
  await ensureDbInitialized();

  // Check if projects already exist
  const existingProjects = await db.select().from(projects).all();
  if (existingProjects.length > 0 && !force) {
    return { seeded: false, reason: "Database already has data" };
  }

  // If force is true, clean existing demo data before re-seeding
  if (force) {
    await db.delete(milestones);
    await db.delete(tasks);
    await db.delete(members);
    await db.delete(projects);
  }

  // Anchor date relative to current time
  const today = new Date();
  const d = (offsetDays: number) => format(addDays(today, offsetDays), "yyyy-MM-dd");
  const nowIso = new Date().toISOString();

  // 1. Demo Project
  const projectId = "proj-vision-tactile-v2";
  await db.insert(projects).values({
    id: projectId,
    name: "视触觉传感器 V2.0 研发排期",
    description: "多模态视触觉传感器感知系统，集成高速微米级光流标记物跟踪、三维弹性体接触力场解算与实时遥测可视化。",
    color: "#0071e3",
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  // 2. Members
  const memberAlex = {
    id: "mem-alex",
    name: "Alex (王工)",
    role: "算法研发专家 (Algorithm)",
    avatarColor: "#6366f1", // Indigo
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const memberBen = {
    id: "mem-ben",
    name: "Ben (李工)",
    role: "硬件架构专家 (Hardware)",
    avatarColor: "#f59e0b", // Amber
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const memberChris = {
    id: "mem-chris",
    name: "Chris (张工)",
    role: "前端可视化工程师 (Frontend)",
    avatarColor: "#06b6d4", // Cyan
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const memberDavid = {
    id: "mem-david",
    name: "David (陈工)",
    role: "测试集成工程师 (Testing)",
    avatarColor: "#10b981", // Emerald
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const memberEmma = {
    id: "mem-emma",
    name: "Emma (赵工)",
    role: "研发项目经理 (Project Manager)",
    avatarColor: "#ec4899", // Pink
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await db.insert(members).values([memberAlex, memberBen, memberChris, memberDavid, memberEmma]);

  // 3. 14 Tasks with realistic overlap and varied progress
  const demoTasks = [
    // Alex - Algorithm
    {
      id: "task-marker-detection",
      projectId,
      assigneeId: memberAlex.id,
      title: "Mark点阵列中心提取与Voronoi分割",
      description: "亚像素精度圆心定位，基于自适应阈值与Voronoi图对弹性体Marker阵列快速拓扑索引。",
      startDate: d(-14),
      endDate: d(-5),
      status: "done",
      priority: "high",
      progress: 100,
      color: "#6366f1",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "task-marker-tracking",
      projectId,
      assigneeId: memberAlex.id,
      title: "高动态大变形光流跟踪算法",
      description: "处理高剪切滑移形变下的标记物失配问题，实现亚像素级平滑鲁棒跟踪。",
      startDate: d(-6),
      endDate: d(4),
      status: "done",
      priority: "high",
      progress: 100,
      color: "#6366f1",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "task-disp-field",
      projectId,
      assigneeId: memberAlex.id,
      title: "稠密三维位移场重构与插值",
      description: "由离散跟踪向量场通过径向基函数(RBF)拟合连续稠密三维表面变形位移场。",
      startDate: d(1),
      endDate: d(12),
      status: "in_progress",
      priority: "urgent",
      progress: 65,
      color: "#6366f1",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "task-algo-opt",
      projectId,
      assigneeId: memberAlex.id,
      title: "CUDA TensorRT 推理加速 (FPS>120)",
      description: "深度神经网络与矩阵求解加速，确保整机端到端算法延时小于 5ms。",
      startDate: d(8),
      endDate: d(22),
      status: "in_progress",
      priority: "medium",
      progress: 30,
      color: "#8b5cf6",
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // Ben - Hardware
    {
      id: "task-pcb-integration",
      projectId,
      assigneeId: memberBen.id,
      title: "刚柔结合PCB集成与高速频闪驱动",
      description: "紧凑腔体结构布局，集成高帧率全局快门MIPI相机与多路可调脉冲LED频闪环光源。",
      startDate: d(-16),
      endDate: d(-2),
      status: "done",
      priority: "high",
      progress: 100,
      color: "#f59e0b",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "task-sensor-calib",
      projectId,
      assigneeId: memberBen.id,
      title: "多轴机械标定架光学畸变校准",
      description: "六轴机械臂自动打标，建立镜头径向/切向畸变矫正矩阵与空间变换映射网格。",
      startDate: d(-1),
      endDate: d(10),
      status: "in_progress",
      priority: "urgent",
      progress: 55,
      color: "#f59e0b",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "task-force-est",
      projectId,
      assigneeId: memberBen.id,
      title: "三轴接触力学有限元解算与标定",
      description: "接触力学反问题求解，标定法向力与切向摩擦力解算精度，实测误差 < 0.05N。",
      startDate: d(6),
      endDate: d(18),
      status: "todo",
      priority: "medium",
      progress: 10,
      color: "#d97706",
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // Chris - Frontend
    {
      id: "task-react-dash",
      projectId,
      assigneeId: memberChris.id,
      title: "实时遥测监控数据大屏 (React Dashboard)",
      description: "低延迟 WebSocket 数据流接收，支持力曲线、接触椭圆、帧率与参数实时调优。",
      startDate: d(-7),
      endDate: d(7),
      status: "in_progress",
      priority: "high",
      progress: 75,
      color: "#06b6d4",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "task-3d-vis",
      projectId,
      assigneeId: memberChris.id,
      title: "Three.js 弹性体形变3D网格与热力图",
      description: "基于 WebGL/Three.js 实时渲染触觉凝胶表面形变凹凸网格，动态贴图力分布热力渐变。",
      startDate: d(3),
      endDate: d(19),
      status: "in_progress",
      priority: "urgent",
      progress: 40,
      color: "#06b6d4",
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // David - Testing
    {
      id: "task-3d-reconstruct",
      projectId,
      assigneeId: memberDavid.id,
      title: "光度立体视觉深度图微米级校验",
      description: "对比激光干涉仪真值深度，评测多光源光度立体视觉重建凹凸轮廓精度。",
      startDate: d(-3),
      endDate: d(9),
      status: "in_progress",
      priority: "medium",
      progress: 50,
      color: "#10b981",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "task-sys-integration",
      projectId,
      assigneeId: memberDavid.id,
      title: "端到端系统延迟基准与压力测试",
      description: "整机长时间满载稳定性巡检，统计千帧平均响应时间、丢帧率与内存稳定性。",
      startDate: d(11),
      endDate: d(24),
      status: "todo",
      priority: "high",
      progress: 0,
      color: "#10b981",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "task-final-validation",
      projectId,
      assigneeId: memberDavid.id,
      title: "机械臂手爪防滑抓握试验与验证",
      description: "搭配灵巧手完成微小物料抓取、突发外力滑移早期预警与抓握自适应闭环验证。",
      startDate: d(21),
      endDate: d(32),
      status: "todo",
      priority: "urgent",
      progress: 0,
      color: "#059669",
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // Emma - PM
    {
      id: "task-roadmap-pm",
      projectId,
      assigneeId: memberEmma.id,
      title: "V2.0 架构评审与交付标准确认",
      description: "各子系统接口规范锁定，排期依赖关系确认与项目门限里程碑评审准则拟定。",
      startDate: d(-15),
      endDate: d(-6),
      status: "done",
      priority: "medium",
      progress: 100,
      color: "#ec4899",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "task-supplier-coordination",
      projectId,
      assigneeId: memberEmma.id,
      title: "光学硅胶模具供应链与客户预演",
      description: "对接高透明度无气泡硅胶注模打样，筹备阶段性试点客户现场抓取场景演示。",
      startDate: d(10),
      endDate: d(26),
      status: "todo",
      priority: "high",
      progress: 15,
      color: "#ec4899",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  await db.insert(tasks).values(demoTasks);

  // 4. Milestones
  const demoMilestones = [
    {
      id: "ms-algo-baseline",
      projectId,
      taskId: "task-marker-tracking",
      title: "算法核心基线达成 (Algorithm Baseline)",
      description: "标记点提取与高动态光流跟踪算法准确率 >99.5% 验证通过。",
      date: d(4),
      status: "achieved",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "ms-hardware-ready",
      projectId,
      taskId: "task-sensor-calib",
      title: "硬件标定与驱动就绪 (Hardware Ready)",
      description: "刚柔板完全入壳封装，光学畸变矫正矩阵校准完毕，通过 48h 频闪老化测试。",
      date: d(10),
      status: "pending",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "ms-integration-complete",
      projectId,
      taskId: "task-sys-integration",
      title: "全链路系统集成完毕 (Integration Complete)",
      description: "相机图像采集、算法力场解算与前端 3D 渲染完成联调，端到端延迟达标。",
      date: d(24),
      status: "pending",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "ms-v2-release",
      projectId,
      taskId: "task-final-validation",
      title: "V2.0 正式发布与签署 (V2.0 Release)",
      description: "防滑抓握试验报告签署，首批试点传感器交付机器人灵巧手搭载测试。",
      date: d(32),
      status: "pending",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  await db.insert(milestones).values(demoMilestones);

  return { seeded: true, projectCount: 1, memberCount: 5, taskCount: demoTasks.length, milestoneCount: demoMilestones.length };
}
