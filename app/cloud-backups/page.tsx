// app/cloud-backups/page.tsx
"use client";
import { useState, useEffect } from "react";

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
      alert("Failed to fetch cloud backups");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Success":
        return "bg-green-100 text-green-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
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
        fetchCloudBackups(); // Refresh the list
        alert("Cloud backup initiated successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating cloud backup:", error);
      alert("Failed to create cloud backup");
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
        fetchCloudBackups(); // Refresh the list
        alert("Cloud backup updated successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating cloud backup:", error);
      alert("Failed to update cloud backup");
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
        fetchCloudBackups(); // Refresh the list
        alert("Cloud backup deleted successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting cloud backup:", error);
      alert("Failed to delete cloud backup");
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
        <h2 className="text-2xl font-bold text-gray-900">Cloud Backups</h2>
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
          <span>Initiate New Backup</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Backups</h3>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.totalBackups}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Size</h3>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.totalSize.toFixed(2)} GB
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Successful</h3>
          <p className="text-2xl font-bold text-green-600">
            {statistics.successCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {statistics.inProgressCount}
          </p>
        </div>
      </div>

      {/* Backups Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Cloud Backups</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Backup
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size (GB)
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
              {cloudBackups.map((backup) => (
                <tr key={backup._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {backup.client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {backup.package}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(backup.lastBackup).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {backup.sizeGB}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        backup.status
                      )}`}
                    >
                      {backup.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(backup)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backup._id)}
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

        {cloudBackups.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No cloud backups found. Initiate your first backup!
          </div>
        )}
      </div>

      {/* Backup Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-black">
              {isEditMode ? "Edit Cloud Backup" : "Initiate New Backup"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Client
                </label>
                <input
                  type="text"
                  name="client"
                  value={formData.client}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Package Name/Type
                </label>
                <input
                  type="text"
                  name="package"
                  value={formData.package}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
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
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Success">Success</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
