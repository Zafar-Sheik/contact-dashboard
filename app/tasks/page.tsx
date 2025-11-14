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
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (isSubmitting) return;

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || isSubmitting) return;

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
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

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedTask) return;

    if (draggedTask.status !== newStatus) {
      try {
        const res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: draggedTask._id,
            status: newStatus,
          }),
        });
        const result = await res.json();
        if (result.success) {
          fetchTasks();
        } else {
          alert(result.error);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to update task status");
      }
    }
    setDraggedTask(null);
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
        return <CheckCircle className="w-3 h-3 text-white" />;
      case TaskStatus.IN_PROGRESS:
        return <PlayCircle className="w-3 h-3 text-white" />;
      default:
        return <Clock className="w-3 h-3 text-white" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TaskStatus.DONE:
        return "bg-green-600 border-green-600 text-white";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-600 border-blue-600 text-white";
      default:
        return "bg-orange-500 border-orange-500 text-white";
    }
  };

  const getStatusHeaderColor = (status: string) => {
    switch (status) {
      case TaskStatus.DONE:
        return "bg-green-700";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-700";
      default:
        return "bg-orange-600";
    }
  };

  const getStatusTextColor = (status: string) => {
    return "text-white";
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

  const tasksByStatus = {
    [TaskStatus.TODO]: filteredTasks.filter(
      (task) => task.status === TaskStatus.TODO
    ),
    [TaskStatus.IN_PROGRESS]: filteredTasks.filter(
      (task) => task.status === TaskStatus.IN_PROGRESS
    ),
    [TaskStatus.DONE]: filteredTasks.filter(
      (task) => task.status === TaskStatus.DONE
    ),
  };

  const statusColumns = [
    {
      status: TaskStatus.TODO,
      title: "To Do",
      count: tasksByStatus[TaskStatus.TODO].length,
    },
    {
      status: TaskStatus.IN_PROGRESS,
      title: "In Progress",
      count: tasksByStatus[TaskStatus.IN_PROGRESS].length,
    },
    {
      status: TaskStatus.DONE,
      title: "Done",
      count: tasksByStatus[TaskStatus.DONE].length,
    },
  ];

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header - Ultra Compact */}
      <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-white">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Task Board</h2>
          <p className="text-gray-500 text-xs">Drag to update status</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filters and Search - Ultra Compact */}
      <div className="flex gap-2 items-center p-3 bg-white border-b border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-600"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-gray-700" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
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

      {/* Kanban Board - Ultra Compact with Individual Column Scrolling */}
      <div className="flex-1 grid grid-cols-3 gap-2 p-2 overflow-hidden">
        {statusColumns.map((column) => (
          <div
            key={column.status}
            className="flex flex-col h-full min-h-0"
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            {/* Column Header - Ultra Compact with Colorful Backgrounds */}
            <div
              className={`flex items-center justify-between p-2 rounded-t border ${getStatusColor(
                column.status
              )} shrink-0`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${getStatusHeaderColor(
                    column.status
                  )}`}
                ></div>
                <h3
                  className={`font-semibold text-sm ${getStatusTextColor(
                    column.status
                  )}`}
                >
                  {column.title}
                </h3>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusTextColor(
                  column.status
                )} bg-white bg-opacity-20 border border-white border-opacity-30`}
              >
                {column.count}
              </span>
            </div>

            {/* Tasks List - Individual Column Scrolling */}
            <div
              className={`flex-1 p-2 space-y-2 border-l border-r border-b rounded-b bg-gray-50 overflow-y-auto min-h-0`}
            >
              {tasksByStatus[column.status].map((task) => (
                <div
                  key={task._id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  className="bg-white rounded border border-gray-200 p-2 hover:shadow-sm transition-all cursor-move shrink-0"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-gray-900 text-xs leading-tight flex-1 pr-1">
                      {task.title}
                    </h4>
                  </div>

                  {task.description && (
                    <p className="text-gray-600 text-xs mb-1 line-clamp-1 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  <div className="space-y-1 mb-1">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <User className="w-3 h-3" />
                      <span className="truncate text-xs">
                        {task.assignee.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(task.status)}
                      <span
                        className={`text-xs capitalize px-1.5 py-0.5 rounded-full ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status.toLowerCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-0.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit task"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-0.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {tasksByStatus[column.status].length === 0 && (
                <div className="text-center py-4 bg-white rounded border-2 border-dashed border-gray-300 shrink-0">
                  <div className="text-gray-400 text-xs">No tasks</div>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Drag tasks here
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No Results State */}
      {filteredTasks.length === 0 && tasks.length > 0 && (
        <div className="text-center py-2 bg-white border-t border-gray-200 shrink-0">
          <div className="text-gray-600 text-xs">
            No tasks match your filters
          </div>
        </div>
      )}

      {/* Create & Edit Modals */}
      {(showCreateModal || (showEditModal && selectedTask)) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              {showCreateModal ? "Create New Task" : "Edit Task"}
            </h3>
            <form
              onSubmit={showCreateModal ? handleCreateTask : handleUpdateTask}
              className="space-y-3"
            >
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
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  rows={2}
                  placeholder="Enter task description"
                />
              </div>

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
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Select a staff member</option>
                  {staffMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} - {member.email}
                    </option>
                  ))}
                </select>
              </div>

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
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

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
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  {Object.values(TaskStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-3 py-1.5 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-sm"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 min-w-20 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>
                        {showCreateModal ? "Creating..." : "Updating..."}
                      </span>
                    </>
                  ) : (
                    <span>
                      {showCreateModal ? "Create Task" : "Update Task"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
