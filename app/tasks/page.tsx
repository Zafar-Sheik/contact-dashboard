// app/tasks/page.tsx
"use client";
import { useState, useEffect } from "react";
import { TaskStatus } from "@/lib/constants/TaskContants";

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
      if (result.success) {
        setTasks(result.data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      alert("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const response = await fetch("/api/staff-members");
      const result = await response.json();
      if (result.data) {
        setStaffMembers(result.data);
      }
    } catch (error) {
      console.error("Error fetching staff members:", error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateModal(false);
        setFormData({
          title: "",
          description: "",
          assignee: "",
          due_date: "",
          status: TaskStatus.TODO,
        });
        fetchTasks(); // Refresh the list
        alert("Task created successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task");
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedTask._id,
          ...formData,
        }),
      });

      const result = await response.json();

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
        fetchTasks(); // Refresh the list
        alert("Task updated successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task");
    }
  };

  //update the handleDeleteTask function:
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: taskId }),
      });

      const result = await response.json();

      if (result.success) {
        fetchTasks(); // Refresh the list
        alert("Task deleted successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task");
    }
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      assignee: task.assignee._id,
      due_date: task.due_date.split("T")[0], // Format date for input
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>New Task</span>
        </button>
      </div>

      {/* Tasks Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {task.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {task.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {task.assignee.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {task.assignee.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(task.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        task.status === TaskStatus.DONE
                          ? "bg-green-100 text-green-800"
                          : task.status === TaskStatus.IN_PROGRESS
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(task)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No tasks found. Create your first task!
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-black">
              Create New Task
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Assignee
                </label>
                <select
                  required
                  value={formData.assignee}
                  onChange={(e) =>
                    setFormData({ ...formData, assignee: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="" className="text-black">
                    Select a staff member
                  </option>
                  {staffMembers.map((member) => (
                    <option
                      key={member._id}
                      value={member._id}
                      className="text-black"
                    >
                      {member.name} - {member.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
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
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  {Object.values(TaskStatus).map((status) => (
                    <option key={status} value={status} className="text-black">
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-black">Edit Task</h3>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Assignee
                </label>
                <select
                  required
                  value={formData.assignee}
                  onChange={(e) =>
                    setFormData({ ...formData, assignee: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="" className="text-black">
                    Select a staff member
                  </option>
                  {staffMembers.map((member) => (
                    <option
                      key={member._id}
                      value={member._id}
                      className="text-black"
                    >
                      {member.name} - {member.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
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
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  {Object.values(TaskStatus).map((status) => (
                    <option key={status} value={status} className="text-black">
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
