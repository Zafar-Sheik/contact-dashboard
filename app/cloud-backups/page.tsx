// app/cloud-backups/page.tsx
"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Cloud,
  Database,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Search,
  Download,
  RefreshCw,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/utils/toast";

interface CloudBackup {
  _id: string;
  client: string;
  package: string;
  status: string;
  sizeGB: number;
  lastBackup: string;
  backedUpContent: string;
  created_at: string;
}

export default function CloudBackups() {
  const [cloudBackups, setCloudBackups] = useState<CloudBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBackup, setEditingBackup] = useState<CloudBackup | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    client: "",
    package: "",
    status: "In Progress",
    sizeGB: 0,
  });

  const [statistics, setStatistics] = useState({
    totalBackups: 0,
    totalSize: 0,
    successCount: 0,
    failedCount: 0,
    inProgressCount: 0,
  });

  useEffect(() => {
    fetchCloudBackups();
  }, []);

  const fetchCloudBackups = async () => {
    try {
      const response = await fetch("/api/cloud-backups");
      const result = await response.json();
      if (result.success) {
        setCloudBackups(result.data);
        setStatistics(result.statistics);
      }
    } catch (error) {
      console.error("Error fetching cloud backups:", error);
      showError("Failed to fetch cloud backups");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "In Progress":
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Success":
        return "bg-green-100 text-green-800 border-green-200";
      case "Failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "sizeGB" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/cloud-backups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        resetForm();
        fetchCloudBackups();
        showSuccess("Cloud backup initiated successfully!");
      } else {
        showError(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating cloud backup:", error);
      showError("Failed to create cloud backup");
    }
  };

  const handleUpdateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBackup) return;

    try {
      const response = await fetch("/api/cloud-backups", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingBackup._id,
          ...formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        resetForm();
        fetchCloudBackups();
        showSuccess("Cloud backup updated successfully!");
      } else {
        showError(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating cloud backup:", error);
      showError("Failed to update cloud backup");
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm("Are you sure you want to delete this cloud backup?")) {
      return;
    }

    try {
      const response = await fetch("/api/cloud-backups", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: backupId }),
      });

      const result = await response.json();

      if (result.success) {
        fetchCloudBackups();
        showSuccess("Cloud backup deleted successfully!");
      } else {
        showError(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting cloud backup:", error);
      showError("Failed to delete cloud backup");
    }
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingBackup(null);
    setFormData({
      client: "",
      package: "",
      status: "In Progress",
      sizeGB: 0,
    });
    setIsFormOpen(true);
  };

  const openEditModal = (backup: CloudBackup) => {
    setIsEditMode(true);
    setEditingBackup(backup);
    setFormData({
      client: backup.client,
      package: backup.package,
      status: backup.status,
      sizeGB: backup.sizeGB,
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setIsEditMode(false);
    setEditingBackup(null);
    setFormData({
      client: "",
      package: "",
      status: "In Progress",
      sizeGB: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isEditMode) {
      handleUpdateBackup(e);
    } else {
      handleCreateBackup(e);
    }
  };

  const filteredBackups = cloudBackups.filter((backup) => {
    const matchesSearch =
      backup.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      backup.package.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || backup.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cloud Backups</h2>
          <p className="text-gray-700 mt-1">
            Manage and monitor your cloud backup operations
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Backup</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Total Backups
            </h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.totalBackups}
          </p>
          <p className="text-sm text-gray-600 mt-1">All backups</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Cloud className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Total Size</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.totalSize.toFixed(2)} GB
          </p>
          <p className="text-sm text-gray-600 mt-1">Storage used</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Successful</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {statistics.successCount}
          </p>
          <p className="text-sm text-gray-600 mt-1">Completed backups</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">In Progress</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {statistics.inProgressCount}
          </p>
          <p className="text-sm text-gray-600 mt-1">Active backups</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search backups..."
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
            <option value="Success">Success</option>
            <option value="In Progress">In Progress</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Backups Grid */}
      <div className="grid gap-4">
        {filteredBackups.map((backup) => (
          <div
            key={backup._id}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {backup.client}
                  </h3>
                  <span
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      backup.status
                    )}`}
                  >
                    {getStatusIcon(backup.status)}
                    {backup.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                  <div>
                    <span className="font-medium text-gray-900">Package:</span>
                    <p className="mt-1">{backup.package}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Size:</span>
                    <p className="mt-1">{backup.sizeGB} GB</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">
                      Last Backup:
                    </span>
                    <p className="mt-1">
                      {new Date(backup.lastBackup).toLocaleDateString()} at{" "}
                      {new Date(backup.lastBackup).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {backup.backedUpContent && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-900 text-sm">
                      Content:
                    </span>
                    <p className="text-gray-700 text-sm mt-1">
                      {backup.backedUpContent}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => openEditModal(backup)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit backup"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteBackup(backup._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete backup"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredBackups.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <div className="text-gray-600 mb-2">No cloud backups found</div>
            <p className="text-gray-700 text-sm mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by initiating your first backup"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <button
                onClick={openCreateModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Initiate Backup</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Backup Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isEditMode ? "Edit Cloud Backup" : "Initiate New Backup"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Client */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Client
                </label>
                <input
                  type="text"
                  name="client"
                  value={formData.client}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  placeholder="Enter client name"
                />
              </div>

              {/* Package */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Package Name/Type
                </label>
                <input
                  type="text"
                  name="package"
                  value={formData.package}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  placeholder="Enter package name"
                />
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Size (GB)
                </label>
                <input
                  type="number"
                  name="sizeGB"
                  value={formData.sizeGB}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Success">Success</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditMode ? "Update Backup" : "Initiate Backup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}