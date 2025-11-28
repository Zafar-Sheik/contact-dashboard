"use client";

import { useState, useEffect } from "react";
import { ProjectStatus } from "@/lib/constants/ProjectConstants";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  PlayCircle,
  PauseCircle,
  TrendingUp,
  Target,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/utils/toast";

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  position?: string;
  department?: string;
  phone?: string;
  avatar_url?: string;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  manager: StaffMember;
  status: ProjectStatus;
  budget?: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

interface ProjectStatistics {
  totalProjects: number;
  totalBudget: number;
  activeCount: number;
  completedCount: number;
  notStartedCount: number;
  onHoldCount: number;
  cancelledCount: number;
  overdueCount: number;
}

interface ApiResponse {
  success: boolean;
  data: Project[];
  statistics: ProjectStatistics;
  error?: string;
  message?: string;
}

interface StaffApiResponse {
  data: StaffMember[];
  error?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statistics, setStatistics] = useState<ProjectStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    manager: "",
    status: ProjectStatus.NOT_STARTED,
    budget: "",
    start_date: "",
    end_date: "",
  });

  // Fetch projects with retry logic
  const fetchProjects = async (retryCount = 0) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (statusFilter !== "all") {
        queryParams.append("status", statusFilter);
      }
      if (managerFilter !== "all") {
        queryParams.append("manager", managerFilter);
      }
      if (searchTerm) {
        queryParams.append("name", searchTerm);
      }

      const response = await fetch(`/api/projects?${queryParams}`);

      if (!response.ok) {
        // Attempt to read specific error message from API response
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (result.success) {
        setProjects(result.data || []);
        setStatistics(result.statistics || null);
        setError(null);
        setLastRefreshed(new Date()); // Update refresh timestamp
      } else {
        throw new Error(result.error || "Failed to fetch projects");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);

      // Retry logic for initial load
      if (retryCount < 2) {
        console.log(`Retrying fetch... Attempt ${retryCount + 1}`);
        setTimeout(
          () => fetchProjects(retryCount + 1),
          1000 * (retryCount + 1)
        );
        return;
      }

      setError("Failed to load projects. Please try refreshing the page.");
      setProjects([]);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff members for manager selection
  const fetchStaffMembers = async () => {
    try {
      const response = await fetch("/api/staff-members");

      if (!response.ok) {
        // Attempt to read specific error message from API response
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
      }

      const result: StaffApiResponse = await response.json();

      if (result.data) {
        setStaffMembers(result.data);
      } else if (result.error) {
        console.error("Error fetching staff members:", result.error);
      }
    } catch (err) {
      console.error("Error fetching staff members:", err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchProjects();
    fetchStaffMembers();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing projects...");
      fetchProjects();
    }, 30000); // 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle edit input changes
  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (editingProject) {
      setEditingProject((prev) => (prev ? { ...prev, [name]: value } : null));
    }
  };

  // Create project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
        }),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setShowCreateModal(false);
        resetForm();
        fetchProjects();
        setError(null);
        showSuccess("Project created successfully!");
      } else {
        throw new Error(result.error || "Failed to create project");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create project";
      setError(errorMessage);
      showError(errorMessage);
      console.error("Error creating project:", err);
    }
  };

  // Update project
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      const response = await fetch("/api/projects", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingProject._id,
          name: editingProject.name,
          description: editingProject.description,
          manager: editingProject.manager._id,
          status: editingProject.status,
          budget: editingProject.budget
            ? parseFloat(editingProject.budget.toString())
            : undefined,
          start_date: editingProject.start_date,
          end_date: editingProject.end_date,
        }),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setShowEditModal(false);
        setEditingProject(null);
        fetchProjects();
        setError(null);
        showSuccess("Project updated successfully!");
      } else {
        throw new Error(result.error || "Failed to update project");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update project";
      setError(errorMessage);
      showError(errorMessage);
      console.error("Error updating project:", err);
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    )
      return;

    try {
      const response = await fetch("/api/projects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        fetchProjects();
        setError(null);
        showSuccess("Project deleted successfully!");
      } else {
        throw new Error(result.error || "Failed to delete project");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete project";
      setError(errorMessage);
      showError(errorMessage);
      console.error("Error deleting project:", err);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      manager: "",
      status: ProjectStatus.NOT_STARTED,
      budget: "",
      start_date: "",
      end_date: "",
    });
  };

  // Open edit modal
  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setShowEditModal(true);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status icon and color
  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return <PlayCircle className="w-4 h-4 text-green-600" />;
      case ProjectStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case ProjectStatus.NOT_STARTED:
        return <Clock className="w-4 h-4 text-gray-600" />;
      case ProjectStatus.ON_HOLD:
        return <PauseCircle className="w-4 h-4 text-yellow-600" />;
      case ProjectStatus.CANCELLED:
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return "bg-green-100 text-green-800 border-green-200";
      case ProjectStatus.COMPLETED:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case ProjectStatus.NOT_STARTED:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case ProjectStatus.ON_HOLD:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case ProjectStatus.CANCELLED:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Calculate days remaining and overdue status
  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isProjectOverdue = (endDate: string, status: ProjectStatus) => {
    return status === ProjectStatus.ACTIVE && getDaysRemaining(endDate) < 0;
  };

  // Apply filters
  const applyFilters = () => {
    fetchProjects();
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setManagerFilter("all");
  };

  // Filter projects client-side for search
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.manager?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    const matchesManager =
      managerFilter === "all" || project.manager?._id === managerFilter;

    return matchesSearch && matchesStatus && matchesManager;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading projects...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-700 mt-1">
            Manage and track your development projects
          </p>
          {lastRefreshed && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Total Projects
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {statistics.totalProjects}
            </p>
            <p className="text-sm text-gray-600 mt-1">All projects</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Active</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {statistics.activeCount}
            </p>
            <p className="text-sm text-gray-600 mt-1">In progress</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Total Budget
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(statistics.totalBudget)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Combined budget</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Overdue</h3>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {statistics.overdueCount}
            </p>
            <p className="text-sm text-gray-600 mt-1">Need attention</p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              <option value="all">All Status</option>
              {Object.values(ProjectStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manager
            </label>
            <select
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              <option value="all">All Managers</option>
              {staffMembers.map((staff) => (
                <option key={staff._id} value={staff._id}>
                  {staff.name} ({staff.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={applyFilters}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4">
        {filteredProjects.map((project) => {
          const daysRemaining = getDaysRemaining(project.end_date);
          const isOverdue = isProjectOverdue(project.end_date, project.status);

          return (
            <div
              key={project._id}
              className={`bg-white rounded-xl border p-4 hover:shadow-md transition-shadow ${
                isOverdue ? "border-red-300 bg-red-50" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {project.name}
                    </h3>
                    <span
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {getStatusIcon(project.status)}
                      {project.status.replace("_", " ")}
                    </span>
                    {isOverdue && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-red-300 bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3" />
                        Overdue
                      </span>
                    )}
                  </div>

                  {project.description && (
                    <p className="text-gray-700 mb-3 text-sm">
                      {project.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="font-medium text-gray-900">
                          Manager:
                        </span>
                        <p className="mt-1">
                          {project.manager?.name || "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="font-medium text-gray-900">
                          Timeline:
                        </span>
                        <p className="mt-1">
                          {formatDate(project.start_date)} -{" "}
                          {formatDate(project.end_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="font-medium text-gray-900">
                          Budget:
                        </span>
                        <p className="mt-1">
                          {project.budget
                            ? formatCurrency(project.budget)
                            : "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="font-medium text-gray-900">
                          Status:
                        </span>
                        <p
                          className={`mt-1 font-medium ${
                            isOverdue
                              ? "text-red-600"
                              : daysRemaining < 7
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}
                        >
                          {isOverdue
                            ? `${Math.abs(daysRemaining)} days overdue`
                            : `${daysRemaining} days remaining`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openEditModal(project)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit project"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <div className="text-gray-600 mb-2">No projects found</div>
            <p className="text-gray-700 text-sm mb-4">
              {searchTerm || statusFilter !== "all" || managerFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first project"}
            </p>
            {!searchTerm &&
              statusFilter === "all" &&
              managerFilter === "all" && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Project</span>
                </button>
              )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Project
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                    placeholder="Project description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Manager *
                    </label>
                    <select
                      name="manager"
                      required
                      value={formData.manager}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="" className="text-gray-500">
                        Select a manager
                      </option>
                      {staffMembers.map((staff) => (
                        <option
                          key={staff._id}
                          value={staff._id}
                          className="text-gray-900"
                        >
                          {staff.name} ({staff.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.values(ProjectStatus).map((status) => (
                        <option
                          key={status}
                          value={status}
                          className="text-gray-900"
                        >
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Budget (ZAR)
                  </label>
                  <input
                    type="number"
                    name="budget"
                    min="0"
                    step="0.01"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      required
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      required
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Project
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProject}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={editingProject.name}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    value={editingProject.description || ""}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Manager *
                    </label>
                    <select
                      name="manager"
                      required
                      value={editingProject.manager?._id || ""}
                      onChange={handleEditInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {staffMembers.map((staff) => (
                        <option
                          key={staff._id}
                          value={staff._id}
                          className="text-gray-900"
                        >
                          {staff.name} ({staff.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={editingProject.status}
                      onChange={handleEditInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.values(ProjectStatus).map((status) => (
                        <option
                          key={status}
                          value={status}
                          className="text-gray-900"
                        >
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Budget (ZAR)
                  </label>
                  <input
                    type="number"
                    name="budget"
                    min="0"
                    step="0.01"
                    value={editingProject.budget || ""}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      required
                      value={editingProject.start_date.split("T")[0]}
                      onChange={handleEditInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      required
                      value={editingProject.end_date.split("T")[0]}
                      onChange={handleEditInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}