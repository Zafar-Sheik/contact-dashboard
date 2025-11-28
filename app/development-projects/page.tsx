// app/development-projects/page.tsx
"use client";

import { useState, useEffect } from "react";
import { ProjectStatus } from "@/lib/constants/ProjectConstants";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  PlayCircle,
  PauseCircle,
  TrendingUp,
  Target,
  Code,
  GitBranch,
  Zap,
} from "lucide-react";

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  position?: string;
}

interface DevelopmentProject {
  _id: string;
  name: string;
  description?: string;
  lead: StaffMember;
  status: ProjectStatus;
  budget?: number;
  startDate: string;
  endDate: string;
  technologies?: string[];
  repositoryUrl?: string;
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
  data: DevelopmentProject[];
  statistics: ProjectStatistics;
  error?: string;
  message?: string;
}

interface StaffApiResponse {
  data: StaffMember[];
  error?: string;
}

export default function DevelopmentProjectsPage() {
  const [projects, setProjects] = useState<DevelopmentProject[]>([]);
  const [statistics, setStatistics] = useState<ProjectStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] =
    useState<DevelopmentProject | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [leadFilter, setLeadFilter] = useState<string>("all");

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    lead: "",
    status: ProjectStatus.NOT_STARTED,
    budget: "",
    startDate: "",
    endDate: "",
    technologies: "",
    repositoryUrl: "",
  });

  // Fetch development projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (statusFilter !== "all") {
        queryParams.append("status", statusFilter);
      }
      if (leadFilter !== "all") {
        queryParams.append("lead", leadFilter);
      }
      if (searchTerm) {
        queryParams.append("name", searchTerm);
      }

      const response = await fetch(`/api/development-projects?${queryParams}`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setProjects(result.data);
        setStatistics(result.statistics);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch development projects");
      }
    } catch (err) {
      setError("Failed to fetch development projects");
      console.error("Error fetching development projects:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff members for lead selection
  const fetchStaffMembers = async () => {
    try {
      const response = await fetch("/api/staff-members");
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

  useEffect(() => {
    fetchProjects();
    fetchStaffMembers();
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
      const response = await fetch("/api/development-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
          technologies: formData.technologies
            ? formData.technologies.split(",").map((tech) => tech.trim())
            : [],
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateModal(false);
        resetForm();
        fetchProjects();
        setError(null);
      } else {
        setError(result.error || "Failed to create development project");
      }
    } catch (err) {
      setError("Failed to create development project");
      console.error("Error creating development project:", err);
    }
  };

  // Update project
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      const response = await fetch("/api/development-projects", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingProject._id,
          name: editingProject.name,
          description: editingProject.description,
          lead: editingProject.lead._id,
          status: editingProject.status,
          budget: editingProject.budget
            ? parseFloat(editingProject.budget.toString())
            : undefined,
          startDate: editingProject.startDate,
          endDate: editingProject.endDate,
          technologies: editingProject.technologies || [],
          repositoryUrl: editingProject.repositoryUrl,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowEditModal(false);
        setEditingProject(null);
        fetchProjects();
        setError(null);
      } else {
        setError(result.error || "Failed to update development project");
      }
    } catch (err) {
      setError("Failed to update development project");
      console.error("Error updating development project:", err);
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this development project? This action cannot be undone."
      )
    )
      return;

    try {
      const response = await fetch("/api/development-projects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (result.success) {
        fetchProjects();
        setError(null);
      } else {
        setError(result.error || "Failed to delete development project");
      }
    } catch (err) {
      setError("Failed to delete development project");
      console.error("Error deleting development project:", err);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      lead: "",
      status: ProjectStatus.NOT_STARTED,
      budget: "",
      startDate: "",
      endDate: "",
      technologies: "",
      repositoryUrl: "",
    });
  };

  // Open edit modal
  const openEditModal = (project: DevelopmentProject) => {
    setEditingProject({
      ...project,
      technologies: project.technologies ? project.technologies.join(", ") : "",
    } as any);
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
        return <PlayCircle className="w-3 h-3 text-green-600" />;
      case ProjectStatus.COMPLETED:
        return <CheckCircle className="w-3 h-3 text-blue-600" />;
      case ProjectStatus.NOT_STARTED:
        return <Clock className="w-3 h-3 text-gray-600" />;
      case ProjectStatus.ON_HOLD:
        return <PauseCircle className="w-3 h-3 text-yellow-600" />;
      case ProjectStatus.CANCELLED:
        return <XCircle className="w-3 h-3 text-red-600" />;
      default:
        return <Target className="w-3 h-3 text-gray-600" />;
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
    setLeadFilter("all");
  };

  // Filter projects client-side for search
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.lead?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.technologies?.some((tech) =>
        tech.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    const matchesLead =
      leadFilter === "all" || project.lead?._id === leadFilter;

    return matchesSearch && matchesStatus && matchesLead;
  });

  // Get technology distribution
  const getTechnologyDistribution = () => {
    const techMap = new Map();
    projects.forEach((project) => {
      project.technologies?.forEach((tech) => {
        techMap.set(tech, (techMap.get(tech) || 0) + 1);
      });
    });
    return Array.from(techMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tech, count]) => ({ tech, count }));
  };

  const techDistribution = getTechnologyDistribution();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Development Projects
          </h2>
          <p className="text-gray-700 text-sm mt-1">
            Manage software development projects and teams
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors text-sm"
        >
          <Plus className="w-3 h-3" />
          <span>New Project</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-3">
          <div className="flex items-center">
            <XCircle className="w-4 h-4 text-red-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Code className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Total Projects
              </h3>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {statistics.totalProjects}
            </p>
            <p className="text-xs text-gray-600 mt-1">All projects</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900">Active</h3>
            </div>
            <p className="text-lg font-bold text-green-600">
              {statistics.activeCount}
            </p>
            <p className="text-xs text-gray-600 mt-1">In development</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Total Budget
              </h3>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(statistics.totalBudget)}
            </p>
            <p className="text-xs text-gray-600 mt-1">Combined budget</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-semibold text-gray-900">Overdue</h3>
            </div>
            <p className="text-lg font-bold text-red-600">
              {statistics.overdueCount}
            </p>
            <p className="text-xs text-gray-600 mt-1">Need attention</p>
          </div>
        </div>
      )}

      {/* Technology Overview */}
      {techDistribution.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Top Technologies
          </h3>
          <div className="flex flex-wrap gap-2">
            {techDistribution.map((item, index) => (
              <div
                key={item.tech}
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-md text-xs"
              >
                <Zap className="w-3 h-3 text-blue-600" />
                <span className="font-medium text-blue-800">{item.tech}</span>
                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                type="text"
                placeholder="Search projects, technologies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
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
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Lead
            </label>
            <select
              value={leadFilter}
              onChange={(e) => setLeadFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
            >
              <option value="all">All Leads</option>
              {staffMembers.map((staff) => (
                <option key={staff._id} value={staff._id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={clearFilters}
              className="w-full px-3 py-1.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Clear
            </button>
            <button
              onClick={applyFilters}
              className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-3">
        {filteredProjects.map((project) => {
          const daysRemaining = getDaysRemaining(project.endDate);
          const isOverdue = isProjectOverdue(project.endDate, project.status);

          return (
            <div
              key={project._id}
              className={`bg-white rounded-lg border p-3 hover:shadow-sm transition-shadow ${
                isOverdue ? "border-red-300 bg-red-50" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-base">
                      {project.name}
                    </h3>
                    <span
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {getStatusIcon(project.status)}
                      {project.status.replace("_", " ")}
                    </span>
                    {isOverdue && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border border-red-300 bg-red-100 text-red-800">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Overdue
                      </span>
                    )}
                  </div>

                  {project.description && (
                    <p className="text-gray-700 mb-2 text-sm">
                      {project.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs text-gray-700 mb-2">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-500" />
                      <div>
                        <span className="font-medium text-gray-900">Lead:</span>
                        <p className="mt-0.5">
                          {project.lead?.name || "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <div>
                        <span className="font-medium text-gray-900">
                          Timeline:
                        </span>
                        <p className="mt-0.5">
                          {formatDate(project.startDate)} -{" "}
                          {formatDate(project.endDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-gray-500" />
                      <div>
                        <span className="font-medium text-gray-900">
                          Budget:
                        </span>
                        <p className="mt-0.5">
                          {project.budget
                            ? formatCurrency(project.budget)
                            : "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <div>
                        <span className="font-medium text-gray-900">
                          Status:
                        </span>
                        <p
                          className={`mt-0.5 font-medium ${
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

                    {project.repositoryUrl && (
                      <div className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3 text-gray-500" />
                        <div>
                          <span className="font-medium text-gray-900">
                            Repo:
                          </span>
                          <a
                            href={project.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 text-blue-600 hover:text-blue-700 text-xs block truncate"
                          >
                            View Repository
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((tech, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded border"
                        >
                          <Code className="w-2.5 h-2.5" />
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => openEditModal(project)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit project"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project._id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <Code className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-600 text-sm mb-1">
              No development projects found
            </div>
            <p className="text-gray-700 text-xs mb-3">
              {searchTerm || statusFilter !== "all" || leadFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first development project"}
            </p>
            {!searchTerm && statusFilter === "all" && leadFilter === "all" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1 mx-auto shadow-sm transition-colors text-sm"
              >
                <Plus className="w-3 h-3" />
                <span>Create Project</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                Create New Project
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleCreateProject} className="p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                      placeholder="Enter project name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={2}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                      placeholder="Project description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">
                        Lead *
                      </label>
                      <select
                        name="lead"
                        required
                        value={formData.lead}
                        onChange={handleInputChange}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="" className="text-gray-500">
                          Select a lead
                        </option>
                        {staffMembers.map((staff) => (
                          <option
                            key={staff._id}
                            value={staff._id}
                            className="text-gray-900"
                          >
                            {staff.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-xs font-medium text-gray-900 mb-1">
                      Budget (ZAR)
                    </label>
                    <input
                      type="number"
                      name="budget"
                      min="0"
                      step="0.01"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        required
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        required
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">
                      Technologies
                    </label>
                    <input
                      type="text"
                      name="technologies"
                      value={formData.technologies}
                      onChange={handleInputChange}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                      placeholder="React, Node.js, MongoDB"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">
                      Repository URL
                    </label>
                    <input
                      type="url"
                      name="repositoryUrl"
                      value={formData.repositoryUrl}
                      onChange={handleInputChange}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                      placeholder="https://github.com/username/repository"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                Edit Project
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleUpdateProject} className="p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={editingProject.name}
                      onChange={handleEditInputChange}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={2}
                      value={editingProject.description || ""}
                      onChange={handleEditInputChange}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">
                        Lead *
                      </label>
                      <select
                        name="lead"
                        required
                        value={editingProject.lead._id}
                        onChange={handleEditInputChange}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {staffMembers.map((staff) => (
                          <option
                            key={staff._id}
                            value={staff._id}
                            className="text-gray-900"
                          >
                            {staff.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={editingProject.status}
                        onChange={handleEditInputChange}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-xs font-medium text-gray-900 mb-1">
                      Budget (ZAR)
                    </label>
                    <input
                      type="number"
                      name="budget"
                      min="0"
                      step="0.01"
                      value={editingProject.budget || ""}
                      onChange={handleEditInputChange}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        required
                        value={editingProject.startDate.split("T")[0]}
                        onChange={handleEditInputChange}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        required
                        value={editingProject.endDate.split("T")[0]}
                        onChange={handleEditInputChange}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">
                      Technologies
                    </label>
                    <input
                      type="text"
                      name="technologies"
                      value={(editingProject.technologies as any) || ""}
                      onChange={handleEditInputChange}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="React, Node.js, MongoDB"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">
                      Repository URL
                    </label>
                    <input
                      type="url"
                      name="repositoryUrl"
                      value={editingProject.repositoryUrl || ""}
                      onChange={handleEditInputChange}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://github.com/username/repository"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-3 py-1.5 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Update Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
