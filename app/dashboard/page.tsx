"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Users,
  ClipboardList,
  Clock,
  AlertTriangle,
  Cloud,
  Code,
  DollarSign,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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

interface Task {
  _id: string;
  title: string;
  due_date: string;
  status: string;
  priority?: string;
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
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
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
      const tasks: Task[] = tasksData.data || [];
      const totalTasks = tasks.length;
      const pendingTasksList = tasks.filter(
        (t) => t.status === "To Do" || t.status === "In Progress"
      );
      const completedTasks = tasks.filter((t) => t.status === "Done").length;
      const overdueTasksList = tasks.filter((t) => {
        const dueDate = new Date(t.due_date);
        return dueDate < new Date() && t.status !== "Done";
      });

      setPendingTasks(pendingTasksList.slice(0, 3));
      setOverdueTasks(overdueTasksList.slice(0, 3));

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

      // Calculate current month's budget
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
        pendingTasks: pendingTasksList.length,
        completedTasks,
        overdueTasks: overdueTasksList.length,
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
        ...tasks.slice(0, 2).map((task) => ({
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

  const projectData = [
    { name: "Active", value: stats.activeProjects },
    { name: "Completed", value: stats.completedProjects },
    { name: "On Hold", value: stats.onHoldProjects },
  ];

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = "blue",
  }: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: any;
    color?: "red" | "orange" | "green" | "blue" | "purple" | "indigo";
  }) => {
    const colorClasses = {
      red: "text-red-600 bg-red-50 border-red-100",
      orange: "text-orange-600 bg-orange-50 border-orange-100",
      green: "text-green-600 bg-green-50 border-green-100",
      blue: "text-blue-600 bg-blue-50 border-blue-100",
      purple: "text-purple-600 bg-purple-50 border-purple-100",
      indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    };

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`relative rounded-2xl p-4 border-2 transition-all duration-300 ${colorClasses[color]} h-full`}
      >
        <div className="flex justify-between items-start h-full">
          <div className="flex-1">
            <p className="text-xs font-semibold opacity-80 uppercase tracking-wider mb-1">
              {title}
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
            {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
          </div>
          <div className="p-2 bg-white rounded-xl shadow-sm border">
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </motion.div>
    );
  };

  const TaskList = ({
    tasks,
    title,
    color,
    emptyMessage,
  }: {
    tasks: Task[];
    title: string;
    color: string;
    emptyMessage: string;
  }) => (
    <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-bold text-sm flex items-center gap-2 ${color}`}>
          <ClipboardList className="w-4 h-4" />
          {title}
        </h3>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
      <div className="space-y-2">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task._id}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  task.status === "In Progress"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {task.status}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4 text-sm">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  );

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
          return "text-green-600 bg-green-100";
        case "in progress":
        case "active":
          return "text-blue-600 bg-blue-100";
        case "failed":
          return "text-red-600 bg-red-100";
        default:
          return "text-amber-600 bg-amber-100";
      }
    };

    const Icon = getIcon();
    const timeAgo = new Date(activity.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-blue-300 transition-all">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {activity.title}
          </p>
          <p className="text-xs text-gray-600 truncate">
            {activity.description}
          </p>
        </div>
        <div className="text-right shrink-0">
          {activity.status && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                activity.status
              )}`}
            >
              {activity.status.split(" ")[0]}
            </span>
          )}
          <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-3 border-t-transparent border-blue-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white text-gray-900 p-4">
      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={refreshData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-blue-200 bg-white text-blue-700 hover:bg-blue-50 transition-all text-sm font-medium shadow-sm"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </motion.button>
      </div>

      {/* Main Grid - Compact Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-100px)]">
        {/* Left Column - Stats and Tasks */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Stats Grid - Compact */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Tasks"
              value={stats.totalTasks}
              subtitle={`${stats.overdueTasks} overdue`}
              icon={ClipboardList}
              color="red"
            />
            <StatCard
              title="Team"
              value={stats.totalStaff}
              subtitle="members"
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Projects"
              value={stats.totalProjects}
              subtitle={`${stats.activeProjects} active`}
              icon={Code}
              color="green"
            />
            <StatCard
              title="Budget"
              value={stats.budgetEntriesCount}
              subtitle={`R${stats.budgetTotal.toLocaleString()}`}
              icon={DollarSign}
              color="purple"
            />
          </div>

          {/* Tasks Section - Compact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
            <TaskList
              tasks={pendingTasks}
              title="Pending Tasks"
              color="text-blue-600"
              emptyMessage="No pending tasks"
            />
            <TaskList
              tasks={overdueTasks}
              title="Overdue Tasks"
              color="text-red-600"
              emptyMessage="No overdue tasks"
            />
          </div>

          {/* Priority Alerts - Compact */}
          <div className="bg-white rounded-2xl p-4 border-2 border-red-100">
            <h3 className="text-red-600 font-bold text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Priority Alerts
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-3 bg-red-50 rounded-xl">
                <div className="text-red-600 font-bold text-lg">
                  {stats.overdueTasks}
                </div>
                <div className="text-gray-600 text-xs font-medium">
                  Overdue Tasks
                </div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-xl">
                <div className="text-red-600 font-bold text-lg">
                  {stats.failedBackups}
                </div>
                <div className="text-gray-600 text-xs font-medium">
                  Failed Backups
                </div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-xl">
                <div className="text-red-600 font-bold text-lg">
                  {stats.overdueProjects}
                </div>
                <div className="text-gray-600 text-xs font-medium">
                  Overdue Projects
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Projects & Activities */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Project Status - Compact */}
          <div className="bg-white rounded-2xl p-4 border-2 border-blue-100 flex-1">
            <h3 className="text-blue-600 font-bold text-sm mb-3 flex items-center gap-2">
              <Code className="w-4 h-4" />
              Project Status
            </h3>
            <div className="h-32 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {projectData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <div className="text-blue-600 font-bold text-sm">
                  {stats.activeProjects}
                </div>
                <div className="text-gray-600 text-xs font-medium">Active</div>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <div className="text-green-600 font-bold text-sm">
                  {stats.completedProjects}
                </div>
                <div className="text-gray-600 text-xs font-medium">Done</div>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <div className="text-amber-600 font-bold text-sm">
                  {stats.onHoldProjects}
                </div>
                <div className="text-gray-600 text-xs font-medium">Hold</div>
              </div>
            </div>
          </div>

          {/* Recent Activities - Compact */}
          <div className="bg-white rounded-2xl p-4 border-2 border-purple-100 flex-1">
            <h3 className="text-purple-600 font-bold text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Activity
            </h3>
            <div className="space-y-2 h-40 overflow-y-auto">
              {recentActivities.map((activity) => (
                <ActivityItem key={activity._id} activity={activity} />
              ))}
              {recentActivities.length === 0 && (
                <p className="text-gray-500 text-center py-4 text-sm">
                  No recent activities
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
