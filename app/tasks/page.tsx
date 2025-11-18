"use client";
import { useState, useEffect } from "react";
import { TaskStatus } from "@/lib/constants/TaskContants";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Calendar as CalendarIcon,
  User,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  Paperclip,
  Download,
  X,
  FileText,
  Image,
} from "lucide-react";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  due_date: string;
  due_time?: string;
  estimated_hours?: number;
  actual_hours?: number;
  assignee: {
    _id: string;
    name: string;
    email: string;
  };
  attachments?: Attachment[];
}

interface Attachment {
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  upload_date: string;
  path: string;
}

interface StaffMember {
  _id: string;
  name: string;
  email: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

// Day Tasks Modal Component
interface DayTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: CalendarDay | null;
  onEditTask: (task: Task) => void;
}

function DayTasksModal({
  isOpen,
  onClose,
  day,
  onEditTask,
}: DayTasksModalProps) {
  if (!isOpen || !day) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TaskStatus.DONE:
        return "bg-green-100 border-green-300 text-green-800";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-100 border-blue-300 text-blue-800";
      default:
        return "bg-orange-100 border-orange-300 text-orange-800";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case TaskStatus.DONE:
        return "bg-green-500";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-500";
      default:
        return "bg-orange-500";
    }
  };

  const getTimeStatusIcon = (task: Task) => {
    if (!task.estimated_hours || !task.actual_hours)
      return <Clock className="w-4 h-4 text-gray-500" />;

    if (task.actual_hours < task.estimated_hours)
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (task.actual_hours > task.estimated_hours)
      return <AlertTriangle className="w-4 h-4 text-red-500" />;

    return <Target className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Tasks for {formatDate(day.date)}
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              {day.tasks.length} task{day.tasks.length !== 1 ? "s" : ""}{" "}
              scheduled
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto p-6">
          {day.tasks.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tasks scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-4">
              {day.tasks.map((task) => (
                <div
                  key={task._id}
                  className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all ${getStatusColor(
                    task.status
                  )}`}
                  onClick={() => onEditTask(task)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusDot(
                            task.status
                          )}`}
                        ></div>
                        <h4 className="font-semibold text-gray-900 truncate">
                          {task.title}
                        </h4>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {task.description || "No description"}
                      </p>

                      {/* Task Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {/* Assignee and Time */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{task.assignee.name}</span>
                          </div>
                          {task.due_time && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{task.due_time}</span>
                            </div>
                          )}
                        </div>

                        {/* Time Tracking */}
                        <div className="space-y-2">
                          {(task.estimated_hours || task.actual_hours) && (
                            <div className="flex items-center gap-2">
                              {getTimeStatusIcon(task)}
                              <div className="flex gap-4">
                                {task.estimated_hours && (
                                  <span className="text-gray-600">
                                    Est: {task.estimated_hours}h
                                  </span>
                                )}
                                {task.actual_hours && (
                                  <span className="text-gray-600">
                                    Act: {task.actual_hours}h
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Attachments */}
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="flex items-center gap-2 text-gray-500 text-sm mt-3">
                          <Paperclip className="w-4 h-4" />
                          <span>{task.attachments.length} attachment(s)</span>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="ml-4 shrink-0">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TasksCalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [showDayTasksModal, setShowDayTasksModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee: "",
    due_date: "",
    due_time: "",
    estimated_hours: "",
    actual_hours: "",
    status: TaskStatus.TODO,
  });

  useEffect(() => {
    fetchTasks();
    fetchStaffMembers();
  }, []);

  const fetchTasks = async () => {
    try {
      let url = "/api/tasks";
      const params = new URLSearchParams();

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (timeFilter !== "all") params.append("time_range", timeFilter);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
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
      // Use FormData if there are files to upload
      if (uploadingFiles.length > 0) {
        const formDataObj = new FormData();
        formDataObj.append("title", formData.title);
        formDataObj.append("description", formData.description);
        formDataObj.append("assignee", formData.assignee);
        formDataObj.append("due_date", formData.due_date);
        formDataObj.append("due_time", formData.due_time);
        formDataObj.append("status", formData.status);

        if (formData.estimated_hours) {
          formDataObj.append("estimated_hours", formData.estimated_hours);
        }
        if (formData.actual_hours) {
          formDataObj.append("actual_hours", formData.actual_hours);
        }

        // Append files
        uploadingFiles.forEach((file) => {
          formDataObj.append("attachments", file);
        });

        const res = await fetch("/api/tasks", {
          method: "POST",
          body: formDataObj,
        });
        const result = await res.json();

        if (result.success) {
          setShowCreateModal(false);
          resetForm();
          fetchTasks();
          alert("Task created successfully!");
        } else {
          alert(result.error);
        }
      } else {
        // Use JSON for tasks without files
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            estimated_hours: formData.estimated_hours
              ? parseFloat(formData.estimated_hours)
              : undefined,
            actual_hours: formData.actual_hours
              ? parseFloat(formData.actual_hours)
              : undefined,
          }),
        });
        const result = await res.json();
        if (result.success) {
          setShowCreateModal(false);
          resetForm();
          fetchTasks();
          alert("Task created successfully!");
        } else alert(result.error);
      }
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
      // Use FormData if there are files to upload or remove
      if (uploadingFiles.length > 0 || filesToRemove.length > 0) {
        const formDataObj = new FormData();
        formDataObj.append("id", selectedTask._id);
        formDataObj.append("title", formData.title);
        formDataObj.append("description", formData.description);
        formDataObj.append("assignee", formData.assignee);
        formDataObj.append("due_date", formData.due_date);
        formDataObj.append("due_time", formData.due_time);
        formDataObj.append("status", formData.status);

        if (formData.estimated_hours) {
          formDataObj.append("estimated_hours", formData.estimated_hours);
        }
        if (formData.actual_hours) {
          formDataObj.append("actual_hours", formData.actual_hours);
        }

        // Append files to upload
        uploadingFiles.forEach((file) => {
          formDataObj.append("attachments", file);
        });

        // Append files to remove
        if (filesToRemove.length > 0) {
          formDataObj.append("remove_attachments", filesToRemove.join(","));
        }

        const res = await fetch("/api/tasks", {
          method: "PATCH",
          body: formDataObj,
        });
        const result = await res.json();

        if (result.success) {
          setShowEditModal(false);
          resetForm();
          fetchTasks();
          alert("Task updated successfully!");
        } else {
          alert(result.error);
        }
      } else {
        // Use JSON for tasks without file changes
        const res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedTask._id,
            ...formData,
            estimated_hours: formData.estimated_hours
              ? parseFloat(formData.estimated_hours)
              : undefined,
            actual_hours: formData.actual_hours
              ? parseFloat(formData.actual_hours)
              : undefined,
          }),
        });
        const result = await res.json();
        if (result.success) {
          setShowEditModal(false);
          resetForm();
          fetchTasks();
          alert("Task updated successfully!");
        } else alert(result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!taskId) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });
      const result = await res.json();
      if (result.success) {
        setShowEditModal(false);
        setShowDeleteConfirm(false);
        setSelectedTask(null);
        fetchTasks();
        alert("Task deleted successfully!");
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete task");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadingFiles((prev) => [...prev, ...files]);
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (filename: string) => {
    setFilesToRemove((prev) => [...prev, filename]);
  };

  const downloadFile = async (
    taskId: string,
    filename: string,
    originalName: string
  ) => {
    try {
      const response = await fetch(
        `/api/tasks/file?taskId=${taskId}&filename=${filename}`
      );
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Failed to download file");
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assignee: "",
      due_date: "",
      due_time: "",
      estimated_hours: "",
      actual_hours: "",
      status: TaskStatus.TODO,
    });
    setUploadingFiles([]);
    setFilesToRemove([]);
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      assignee: task.assignee._id,
      due_date: task.due_date.split("T")[0],
      due_time: task.due_time || "",
      estimated_hours: task.estimated_hours?.toString() || "",
      actual_hours: task.actual_hours?.toString() || "",
      status: task.status as TaskStatus,
    });
    setUploadingFiles([]);
    setFilesToRemove([]);
    setShowEditModal(true);
    setShowDeleteConfirm(false);
    setShowDayTasksModal(false); // Close day tasks modal when editing a task
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteConfirm(false);
    setSelectedTask(null);
    resetForm();
    setShowDayTasksModal(false);
    setSelectedDay(null);
  };

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day);
    setShowDayTasksModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TaskStatus.DONE:
        return "bg-green-100 border-green-300 text-green-800";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-100 border-blue-300 text-blue-800";
      default:
        return "bg-orange-100 border-orange-300 text-orange-800";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case TaskStatus.DONE:
        return "bg-green-500";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-500";
      default:
        return "bg-orange-500";
    }
  };

  const getTimeStatus = (task: Task) => {
    if (!task.estimated_hours || !task.actual_hours) return "neutral";
    if (task.actual_hours < task.estimated_hours) return "under";
    if (task.actual_hours > task.estimated_hours) return "over";
    return "exact";
  };

  const getTimeStatusIcon = (task: Task) => {
    const status = getTimeStatus(task);
    switch (status) {
      case "under":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "over":
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
      case "exact":
        return <Target className="w-3 h-3 text-blue-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-500" />;
    }
  };

  // Calendar navigation
  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    const days = direction === "prev" ? -7 : 7;
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === "week") {
      return generateWeekDays();
    }

    // Month view
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));

    const days: CalendarDay[] = [];
    const currentDateObj = new Date(startDate);

    while (currentDateObj <= endDate) {
      const date = new Date(currentDateObj);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === new Date().toDateString();

      const dayTasks = filteredTasks.filter((task) => {
        const taskDate = new Date(task.due_date);
        return (
          taskDate.getDate() === date.getDate() &&
          taskDate.getMonth() === date.getMonth() &&
          taskDate.getFullYear() === date.getFullYear()
        );
      });

      days.push({
        date,
        isCurrentMonth,
        isToday,
        tasks: dayTasks,
      });

      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    return days;
  };

  const generateWeekDays = (): CalendarDay[] => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days: CalendarDay[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      const isToday = date.toDateString() === new Date().toDateString();
      const isCurrentMonth = date.getMonth() === currentDate.getMonth();

      const dayTasks = filteredTasks.filter((task) => {
        const taskDate = new Date(task.due_date);
        return (
          taskDate.getDate() === date.getDate() &&
          taskDate.getMonth() === date.getMonth() &&
          taskDate.getFullYear() === date.getFullYear()
        );
      });

      days.push({
        date,
        isCurrentMonth,
        isToday,
        tasks: dayTasks,
      });
    }

    return days;
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;

    // Time-based filtering
    const matchesTime =
      timeFilter === "all" ||
      (timeFilter === "no_time" && !task.estimated_hours) ||
      (timeFilter === "under_estimated" &&
        task.actual_hours &&
        task.estimated_hours &&
        task.actual_hours < task.estimated_hours) ||
      (timeFilter === "over_estimated" &&
        task.actual_hours &&
        task.estimated_hours &&
        task.actual_hours > task.estimated_hours) ||
      (timeFilter === "completed" &&
        task.actual_hours &&
        task.estimated_hours &&
        task.actual_hours === task.estimated_hours);

    return matchesSearch && matchesStatus && matchesTime;
  });

  const calendarDays = generateCalendarDays();

  // Calculate time statistics
  const totalEstimatedHours = tasks.reduce(
    (sum, task) => sum + (task.estimated_hours || 0),
    0
  );
  const totalActualHours = tasks.reduce(
    (sum, task) => sum + (task.actual_hours || 0),
    0
  );
  const tasksWithTime = tasks.filter((task) => task.estimated_hours).length;
  const averageDeviation =
    tasksWithTime > 0
      ? tasks.reduce((sum, task) => {
          if (task.estimated_hours && task.actual_hours) {
            return sum + Math.abs(task.actual_hours - task.estimated_hours);
          }
          return sum;
        }, 0) / tasksWithTime
      : 0;

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Task Calendar</h2>
          <p className="text-gray-500 text-sm">
            Manage tasks with time tracking and file attachments
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
          >
            Today
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateMonth("next")}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 min-w-48">
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
            {viewMode === "week" &&
              ` - Week ${Math.ceil(currentDate.getDate() / 7)}`}
          </h3>
        </div>

        <div className="flex items-center gap-4 flex-1 sm:flex-initial justify-between sm:justify-end">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                viewMode === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                viewMode === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-600"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              <option value="all">All Status</option>
              {Object.values(TaskStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              <option value="all">All Time</option>
              <option value="no_time">No Time Set</option>
              <option value="under_estimated">Under Estimated</option>
              <option value="over_estimated">Over Estimated</option>
              <option value="completed">Exactly Estimated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center font-semibold text-gray-700 bg-gray-100 rounded-lg"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div
          className={`grid gap-1 ${
            viewMode === "month" ? "grid-cols-7" : "grid-cols-1"
          }`}
        >
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`min-h-32 border rounded-lg p-2 transition-colors cursor-pointer hover:bg-gray-50 ${
                day.isToday
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              } ${!day.isCurrentMonth ? "bg-gray-50 opacity-60" : ""}`}
              onClick={() => handleDayClick(day)}
            >
              {/* Date Header */}
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`text-sm font-medium ${
                    day.isToday
                      ? "text-blue-600"
                      : day.isCurrentMonth
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  {day.date.getDate()}
                </span>
                {day.tasks.length > 0 && (
                  <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                    {day.tasks.length}
                  </span>
                )}
              </div>

              {/* Tasks */}
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {day.tasks.map((task) => (
                  <div
                    key={task._id}
                    className={`p-2 rounded border text-xs cursor-pointer hover:shadow-md transition-all ${getStatusColor(
                      task.status
                    )}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent day click when clicking on task
                      openEditModal(task);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <div
                            className={`w-2 h-2 rounded-full ${getStatusDot(
                              task.status
                            )}`}
                          ></div>
                          <span className="font-medium truncate">
                            {task.title}
                          </span>
                        </div>

                        {/* Time Information */}
                        {(task.estimated_hours || task.actual_hours) && (
                          <div className="flex items-center gap-2 mb-1">
                            {getTimeStatusIcon(task)}
                            {task.estimated_hours && (
                              <span className="text-gray-600">
                                Est: {task.estimated_hours}h
                              </span>
                            )}
                            {task.actual_hours && (
                              <span className="text-gray-600">
                                Act: {task.actual_hours}h
                              </span>
                            )}
                          </div>
                        )}

                        <div className="text-gray-600 truncate">
                          {task.assignee.name}
                          {task.due_time && ` • ${task.due_time}`}
                        </div>

                        {task.attachments && task.attachments.length > 0 && (
                          <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                            <Paperclip className="w-3 h-3" />
                            <span>{task.attachments.length} file(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Task Summary with Time Tracking */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 text-sm">
          <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-orange-800 font-semibold">To Do</div>
            <div className="text-2xl font-bold text-orange-600">
              {tasks.filter((t) => t.status === TaskStatus.TODO).length}
            </div>
          </div>
          <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-blue-800 font-semibold">In Progress</div>
            <div className="text-2xl font-bold text-blue-600">
              {tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length}
            </div>
          </div>
          <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-800 font-semibold">Done</div>
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter((t) => t.status === TaskStatus.DONE).length}
            </div>
          </div>
          <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-purple-800 font-semibold">Estimated Hours</div>
            <div className="text-2xl font-bold text-purple-600">
              {totalEstimatedHours.toFixed(1)}
            </div>
          </div>
          <div className="text-center p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="text-indigo-800 font-semibold">Actual Hours</div>
            <div className="text-2xl font-bold text-indigo-600">
              {totalActualHours.toFixed(1)}
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-gray-800 font-semibold">Avg Deviation</div>
            <div className="text-2xl font-bold text-gray-600">
              {averageDeviation.toFixed(1)}h
            </div>
          </div>
        </div>
      </div>

      {/* Day Tasks Modal */}
      <DayTasksModal
        isOpen={showDayTasksModal}
        onClose={() => {
          setShowDayTasksModal(false);
          setSelectedDay(null);
        }}
        day={selectedDay}
        onEditTask={openEditModal}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Task
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  rows={3}
                  placeholder="Enter task description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Assignee *
                </label>
                <select
                  required
                  value={formData.assignee}
                  onChange={(e) =>
                    setFormData({ ...formData, assignee: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Select a staff member</option>
                  {staffMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} - {member.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={formData.due_time}
                    onChange={(e) =>
                      setFormData({ ...formData, due_time: e.target.value })
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="1000"
                    value={formData.estimated_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimated_hours: e.target.value,
                      })
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Actual Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="1000"
                    value={formData.actual_hours}
                    onChange={(e) =>
                      setFormData({ ...formData, actual_hours: e.target.value })
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="0.0"
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Attachments
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <Paperclip className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to upload files or drag and drop
                    </span>
                    <span className="text-xs text-gray-500">
                      Maximum file size: 10MB
                    </span>
                  </label>
                </div>

                {/* Uploading Files List */}
                {uploadingFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      Files to upload:
                    </h4>
                    {uploadingFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                      >
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.type)}
                          <span className="text-sm text-gray-700">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUploadingFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  {Object.values(TaskStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-sm"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 min-w-20 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Task</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal with Delete Option */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Task</h3>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {!showDeleteConfirm ? (
              <form onSubmit={handleUpdateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    rows={3}
                    placeholder="Enter task description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Assignee *
                  </label>
                  <select
                    required
                    value={formData.assignee}
                    onChange={(e) =>
                      setFormData({ ...formData, assignee: e.target.value })
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">Select a staff member</option>
                    {staffMembers.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name} - {member.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.due_date}
                      onChange={(e) =>
                        setFormData({ ...formData, due_date: e.target.value })
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Due Time
                    </label>
                    <input
                      type="time"
                      value={formData.due_time}
                      onChange={(e) =>
                        setFormData({ ...formData, due_time: e.target.value })
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="1000"
                      value={formData.estimated_hours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimated_hours: e.target.value,
                        })
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="0.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Actual Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="1000"
                      value={formData.actual_hours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          actual_hours: e.target.value,
                        })
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="0.0"
                    />
                  </div>
                </div>

                {/* File Management Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Attachments
                  </label>

                  {/* Existing Files */}
                  {selectedTask.attachments &&
                    selectedTask.attachments.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          Current files:
                        </h4>
                        {selectedTask.attachments
                          .filter(
                            (att) => !filesToRemove.includes(att.filename)
                          )
                          .map((attachment, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                            >
                              <div className="flex items-center gap-2">
                                {getFileIcon(attachment.mime_type)}
                                <span className="text-sm text-gray-700">
                                  {attachment.original_name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({formatFileSize(attachment.size)})
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadFile(
                                      selectedTask._id,
                                      attachment.filename,
                                      attachment.original_name
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Download file"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeExistingFile(attachment.filename)
                                  }
                                  className="text-red-600 hover:text-red-800"
                                  title="Remove file"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                  {/* File Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload-edit"
                    />
                    <label
                      htmlFor="file-upload-edit"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <Paperclip className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Click to upload additional files
                      </span>
                      <span className="text-xs text-gray-500">
                        Maximum file size: 10MB
                      </span>
                    </label>
                  </div>

                  {/* Uploading Files List */}
                  {uploadingFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        New files to upload:
                      </h4>
                      {uploadingFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200"
                        >
                          <div className="flex items-center gap-2">
                            {getFileIcon(file.type)}
                            <span className="text-sm text-gray-700">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeUploadingFile(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    {Object.values(TaskStatus).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-between gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-sm"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 min-w-20 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          <span>Updating...</span>
                        </>
                      ) : (
                        <span>Update Task</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              // Delete Confirmation
              <div className="text-center py-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Task
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete "{selectedTask.title}"? This
                  action cannot be undone.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteTask(selectedTask._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Task
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
