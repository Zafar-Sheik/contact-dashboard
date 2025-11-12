// app/tasks/page.tsx
"use client";
import { useState, useEffect } from "react";
import { TaskStatus } from "@/lib/constants/TaskContants";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle,
  Clock,
  PlayCircle,
} from "lucide-react";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  due_date: string;
  assignee: {
    _id: string;
    name: string;
    email: string;
  };
}

interface StaffMember {
  _id: string;
  name: string;
  email: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee: "",
    due_date: "",
    status: TaskStatus.TODO,
  });

  useEffect(() => {
    fetchTasks();
    fetchStaffMembers();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      const result = await response.json();
      if (result.success) setTasks(result.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const response = await fetch("/api/staff-members");
      const result = await response.json();
      if (result.data) setStaffMembers(result.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        setShowCreateModal(false);
        setFormData({
          title: "",
          description: "",
          assignee: "",
          due_date: "",
          status: TaskStatus.TODO,
        });
        fetchTasks();
        alert("Task created successfully!");
      } else alert(result.error);
    } catch (err) {
      console.error(err);
      alert("Failed to create task");
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedTask._id, ...formData }),
      });
      const result = await res.json();
      if (result.success) {
        setShowEditModal(false);
        setSelectedTask(null);
        setFormData({
          title: "",
          description: "",
          assignee: "",
          due_date: "",
          status: TaskStatus.TODO,
        });
        fetchTasks();
        alert("Task updated successfully!");
      } else alert(result.error);
    } catch (err) {
      console.error(err);
      alert("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });
      const result = await res.json();
      if (result.success) fetchTasks();
      else alert(result.error);
    } catch (err) {
      console.error(err);
      alert("Failed to delete task");
    }
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      assignee: task.assignee._id,
      due_date: task.due_date.split("T")[0],
      status: task.status as TaskStatus,
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      title: "",
      description: "",
      assignee: "",
      due_date: "",
      status: TaskStatus.TODO,
    });
    setShowCreateModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case TaskStatus.DONE:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case TaskStatus.IN_PROGRESS:
        return <PlayCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TaskStatus.DONE:
        return "bg-green-100 text-green-800 border-green-200";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
          <p className="text-gray-700 mt-1">
            Manage and track your team's tasks
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-700" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
          >
            <option value="all">All Status</option>
            {Object.values(TaskStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid gap-4">
        {filteredTasks.map((task) => (
          <div
            key={task._id}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {task.title}
                  </h3>
                  <span
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      task.status
                    )}`}
                  >
                    {getStatusIcon(task.status)}
                    {task.status}
                  </span>
                </div>
                {task.description && (
                  <p className="text-gray-700 mb-3 text-sm">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{task.assignee.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Due {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => openEditModal(task)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit task"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="text-gray-600 mb-2">No tasks found</div>
            <p className="text-gray-700 text-sm mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first task"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <button
                onClick={openCreateModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create & Edit Modals */}
      {(showCreateModal || (showEditModal && selectedTask)) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showCreateModal ? "Create New Task" : "Edit Task"}
            </h3>
            <form
              onSubmit={showCreateModal ? handleCreateTask : handleUpdateTask}
              className="space-y-4"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  placeholder="Enter task title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  rows={3}
                  placeholder="Enter task description"
                />
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Assignee
                </label>
                <select
                  required
                  value={formData.assignee}
                  onChange={(e) =>
                    setFormData({ ...formData, assignee: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" className="text-gray-500">
                    Select a staff member
                  </option>
                  {staffMembers.map((member) => (
                    <option
                      key={member._id}
                      value={member._id}
                      className="text-gray-900"
                    >
                      {member.name} - {member.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as TaskStatus,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.values(TaskStatus).map((status) => (
                    <option
                      key={status}
                      value={status}
                      className="text-gray-900"
                    >
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showCreateModal ? "Create Task" : "Update Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
