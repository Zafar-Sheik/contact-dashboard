"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Users,
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Code,
  Database,
  TrendingUp,
  Zap,
  DollarSign,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalStaff: number;
  totalBackups: number;
  totalBackupSize: number;
  successBackups: number;
  failedBackups: number;
  inProgressBackups: number;
  totalProjects: number;
  totalBudget: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  onHoldProjects: number;
  budgetTotal: number;
  budgetEntriesCount: number;
  currentMonthBudget: number;
}

interface RecentActivity {
  _id: string;
  title: string;
  description: string;
  type: "task" | "project" | "backup" | "budget";
  timestamp: string;
  status?: string;
}

interface BudgetEntry {
  _id: string;
  category: string;
  amount: number;
  month: string;
  year: number;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    totalStaff: 0,
    totalBackups: 0,
    totalBackupSize: 0,
    successBackups: 0,
    failedBackups: 0,
    inProgressBackups: 0,
    totalProjects: 0,
    totalBudget: 0,
    activeProjects: 0,
    completedProjects: 0,
    overdueProjects: 0,
    onHoldProjects: 0,
    budgetTotal: 0,
    budgetEntriesCount: 0,
    currentMonthBudget: 0,
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        tasksResponse,
        staffResponse,
        backupsResponse,
        projectsResponse,
        budgetResponse,
      ] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/staff-members"),
        fetch("/api/cloud-backups"),
        fetch("/api/development-projects"),
        fetch("/api/budget-tracker"),
      ]);

      const tasksData = await tasksResponse.json();
      const staffData = await staffResponse.json();
      const backupsData = await backupsResponse.json();
      const projectsData = await projectsResponse.json();
      const budgetData = await budgetResponse.json();

      // Process tasks data
      const tasks = tasksData.data || [];
      const totalTasks = tasks.length;
      const pendingTasks = tasks.filter(
        (t: any) => t.status === "To Do" || t.status === "In Progress"
      ).length;
      const completedTasks = tasks.filter(
        (t: any) => t.status === "Done"
      ).length;
      const overdueTasks = tasks.filter((t: any) => {
        const dueDate = new Date(t.due_date);
        return dueDate < new Date() && t.status !== "Done";
      }).length;

      // Process other data
      const staffMembers = staffData.data || [];
      const backups = backupsData.data || [];
      const backupStats = backupsData.statistics || {};
      const projects = projectsData.data || [];
      const projectStats = projectsData.statistics || {};

      // Process budget data
      const budgetEntries: BudgetEntry[] = budgetData.data || [];
      const budgetTotal = budgetData.totalAmount || 0;
      const budgetEntriesCount = budgetData.count || 0;

      // Calculate current month's budget (assuming current month)
      const currentMonth = new Date().toLocaleString("default", {
        month: "long",
      });
      const currentYear = new Date().getFullYear();
      const currentMonthBudget = budgetEntries
        .filter(
          (entry) => entry.month === currentMonth && entry.year === currentYear
        )
        .reduce((sum, entry) => sum + entry.amount, 0);

      setStats({
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
        totalStaff: staffMembers.length,
        totalBackups: backupStats.totalBackups || 0,
        totalBackupSize: backupStats.totalSize || 0,
        successBackups: backupStats.successCount || 0,
        failedBackups: backupStats.failedCount || 0,
        inProgressBackups: backupStats.inProgressCount || 0,
        totalProjects: projectStats.totalProjects || 0,
        totalBudget: projectStats.totalBudget || 0,
        activeProjects: projectStats.activeCount || 0,
        completedProjects: projectStats.completedCount || 0,
        overdueProjects: projectStats.overdueCount || 0,
        onHoldProjects: projectStats.onHoldCount || 0,
        budgetTotal,
        budgetEntriesCount,
        currentMonthBudget,
      });

      // Generate recent activities
      const activities: RecentActivity[] = [
        ...tasks.slice(0, 2).map((task: any) => ({
          _id: task._id,
          title: task.title,
          description: `Due: ${new Date(task.due_date).toLocaleDateString()}`,
          type: "task" as const,
          timestamp: task.due_date,
          status: task.status,
        })),
        ...projects.slice(0, 2).map((project: any) => ({
          _id: project._id,
          title: project.name,
          description: `Lead: ${project.lead?.name || "Unknown"}`,
          type: "project" as const,
          timestamp: project.startDate,
          status: project.status,
        })),
        ...backups.slice(0, 1).map((backup: any) => ({
          _id: backup._id,
          title: backup.client,
          description: `Package: ${backup.package}`,
          type: "backup" as const,
          timestamp: backup.lastBackup,
          status: backup.status,
        })),
        ...budgetEntries.slice(0, 1).map((entry: BudgetEntry) => ({
          _id: entry._id,
          title: `Budget: ${entry.category}`,
          description: `${entry.month} ${entry.year}`,
          type: "budget" as const,
          timestamp: entry.created_at,
          status: `R${entry.amount.toLocaleString()}`,
        })),
      ].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setRecentActivities(activities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const completionRate =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  const projectCompletionRate =
    stats.totalProjects > 0
      ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
      : 0;

  const backupSuccessRate =
    stats.totalBackups > 0
      ? Math.round((stats.successBackups / stats.totalBackups) * 100)
      : 0;

  // Chart data
  const taskData = [
    { name: "Done", value: stats.completedTasks },
    { name: "Pending", value: stats.pendingTasks },
    { name: "Overdue", value: stats.overdueTasks },
  ];

  const projectData = [
    { name: "Active", value: stats.activeProjects },
    { name: "Completed", value: stats.completedProjects },
    { name: "On Hold", value: stats.onHoldProjects },
  ];

  const COLORS = ["#0066CC", "#0088FE", "#00C49F", "#FFBB28"];
  const LIGHT_COLORS = {
    cyan: "#0066CC",
    blue: "#0088FE",
    green: "#00A86B",
    red: "#DC2626",
    purple: "#7C3AED",
    yellow: "#D97706",
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = "cyan",
  }: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: any;
    color?: "cyan" | "blue" | "green" | "red" | "purple" | "yellow";
  }) => {
    const colorClasses = {
      cyan: `text-[${LIGHT_COLORS.cyan}] bg-blue-50 border-blue-200`,
      blue: `text-[${LIGHT_COLORS.blue}] bg-sky-50 border-sky-200`,
      green: `text-[${LIGHT_COLORS.green}] bg-green-50 border-green-200`,
      red: `text-[${LIGHT_COLORS.red}] bg-red-50 border-red-200`,
      purple: `text-[${LIGHT_COLORS.purple}] bg-purple-50 border-purple-200`,
      yellow: `text-[${LIGHT_COLORS.yellow}] bg-amber-50 border-amber-200`,
    };

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`relative border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 ${colorClasses[color]} h-full`}
      >
        <div className="flex justify-between items-start h-full">
          <div className="flex-1">
            <p className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">
              {title}
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
            {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
          </div>
          <div className="p-2 bg-white rounded-lg shadow-xs">
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </motion.div>
    );
  };

  const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
    const getIcon = () => {
      switch (activity.type) {
        case "task":
          return ClipboardList;
        case "project":
          return Code;
        case "backup":
          return Cloud;
        case "budget":
          return DollarSign;
        default:
          return Clock;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case "done":
        case "completed":
        case "success":
          return "text-green-600";
        case "in progress":
        case "active":
          return "text-blue-600";
        case "failed":
          return "text-red-600";
        default:
          return "text-amber-600";
      }
    };

    const Icon = getIcon();
    const timeAgo = new Date(activity.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 hover:border-blue-300 transition-all">
        <div className="p-1.5 bg-blue-100 rounded">
          <Icon className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate leading-tight">
            {activity.title}
          </p>
          <p className="text-xs text-gray-600 truncate leading-tight">
            {activity.description}
          </p>
        </div>
        <div className="text-right shrink-0">
          {activity.status && (
            <p
              className={`text-xs font-medium ${getStatusColor(
                activity.status
              )} leading-tight`}
            >
              {activity.status.split(" ")[0]}
            </p>
          )}
          <p className="text-xs text-gray-500 leading-tight">{timeAgo}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-3 border-t-transparent border-blue-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-900 p-4 overflow-hidden">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              System Overview
            </h1>
            <p className="text-xs text-gray-600">
              Real-time performance metrics
            </p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={refreshData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 transition-all text-sm shadow-xs"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </motion.button>
      </div>

      {/* COMPACT MAIN GRID */}
      <div className="grid grid-cols-12 gap-3 h-[calc(100vh-100px)]">
        {/* LEFT COLUMN - KEY METRICS */}
        <div className="col-span-8 grid grid-cols-4 gap-3">
          {/* TOP ROW - CORE METRICS */}
          <div className="col-span-1">
            <StatCard
              title="Tasks"
              value={stats.totalTasks}
              subtitle={`${stats.overdueTasks} overdue`}
              icon={ClipboardList}
              color="blue"
            />
          </div>
          <div className="col-span-1">
            <StatCard
              title="Team"
              value={stats.totalStaff}
              subtitle="members"
              icon={Users}
              color="cyan"
            />
          </div>
          <div className="col-span-1">
            <StatCard
              title="Projects"
              value={stats.totalProjects}
              subtitle={`${stats.activeProjects} active`}
              icon={Code}
              color="green"
            />
          </div>
          <div className="col-span-1">
            <StatCard
              title="Budget Entries"
              value={stats.budgetEntriesCount}
              subtitle={`R${stats.budgetTotal.toLocaleString()} total`}
              icon={DollarSign}
              color="yellow"
            />
          </div>

          {/* TASK CHART */}
          <div className="col-span-2 rounded-xl p-4 bg-white border border-gray-200 shadow-xs">
            <h3 className="text-blue-600 font-medium text-sm mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Task Distribution
            </h3>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={taskData}>
                <XAxis
                  dataKey="name"
                  stroke="#6B7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    color: "#1F2937",
                    fontSize: "12px",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill={LIGHT_COLORS.blue}
                  radius={[2, 2, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* COMPLETION RATES */}
          <div className="col-span-2 rounded-xl p-4 bg-white border border-gray-200 shadow-xs">
            <h3 className="text-green-600 font-medium text-sm mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completion Rates
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Tasks</span>
                  <span className="text-blue-600 font-medium">
                    {completionRate}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Projects</span>
                  <span className="text-green-600 font-medium">
                    {projectCompletionRate}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${projectCompletionRate}%` }}
                    className="h-full bg-green-500 rounded-full"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Backups</span>
                  <span className="text-purple-600 font-medium">
                    {backupSuccessRate}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${backupSuccessRate}%` }}
                    className="h-full bg-purple-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BUDGET & ALERTS */}
          <div className="col-span-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 bg-white border border-yellow-200 shadow-xs">
              <h3 className="text-yellow-600 font-medium text-sm mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Budget Overview
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Total Budget</span>
                  <span className="text-lg font-bold text-gray-900">
                    R{stats.budgetTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">This Month</span>
                  <span className="text-sm font-semibold text-green-600">
                    R{stats.currentMonthBudget.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Entries</span>
                  <span className="text-sm font-medium text-blue-600">
                    {stats.budgetEntriesCount}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-4 bg-white border border-red-200 shadow-xs">
              <h3 className="text-red-600 font-medium text-sm mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Alerts
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Overdue Tasks</span>
                  <span className="text-red-600 font-bold">
                    {stats.overdueTasks}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Failed Backups</span>
                  <span className="text-red-600 font-bold">
                    {stats.failedBackups}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Overdue Projects</span>
                  <span className="text-red-600 font-bold">
                    {stats.overdueProjects}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - PROJECTS & ACTIVITIES */}
        <div className="col-span-4 flex flex-col gap-3">
          {/* PROJECT STATUS */}
          <div className="flex-1 rounded-xl p-4 bg-white border border-gray-200 shadow-xs">
            <h3 className="text-blue-600 font-medium text-sm mb-3 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5" />
              Project Status
            </h3>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={projectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={40}
                  paddingAngle={1}
                  dataKey="value"
                >
                  {projectData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    color: "#1F2937",
                    fontSize: "12px",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-1 mt-3 text-xs text-center">
              <div>
                <div className="text-blue-600 font-bold">
                  {stats.activeProjects}
                </div>
                <div className="text-gray-600">Active</div>
              </div>
              <div>
                <div className="text-green-600 font-bold">
                  {stats.completedProjects}
                </div>
                <div className="text-gray-600">Done</div>
              </div>
              <div>
                <div className="text-amber-600 font-bold">
                  {stats.onHoldProjects}
                </div>
                <div className="text-gray-600">Hold</div>
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITIES */}
          <div className="flex-1 rounded-xl p-4 bg-white border border-gray-200 shadow-xs">
            <h3 className="text-blue-600 font-medium text-sm mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Recent Activity
            </h3>
            <div className="space-y-2 max-h-[140px] overflow-y-auto">
              {recentActivities.map((activity) => (
                <ActivityItem key={activity._id} activity={activity} />
              ))}
              {recentActivities.length === 0 && (
                <p className="text-gray-500 text-center py-4 text-xs">
                  No recent activities
                </p>
              )}
            </div>
          </div>

          {/* BACKUP STATUS */}
          <div className="rounded-xl p-4 bg-white border border-purple-200 shadow-xs">
            <h3 className="text-purple-600 font-medium text-sm mb-2 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5" />
              Backup Health
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-green-600 font-bold text-lg">
                  {stats.successBackups}
                </div>
                <div className="text-gray-600 text-xs">Success</div>
              </div>
              <div>
                <div className="text-amber-600 font-bold text-lg">
                  {stats.inProgressBackups}
                </div>
                <div className="text-gray-600 text-xs">In Progress</div>
              </div>
              <div>
                <div className="text-red-600 font-bold text-lg">
                  {stats.failedBackups}
                </div>
                <div className="text-gray-600 text-xs">Failed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
