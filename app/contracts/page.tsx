// app/contracts/page.tsx
"use client";
import { useState, useEffect } from "react";

interface Contract {
  _id: string;
  title: string;
  counterparty: string;
  startDate: string;
  endDate: string;
  status: string;
  value: number;
  description?: string;
  created_at: string;
}

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    counterparty: "",
    startDate: "",
    endDate: "",
    status: "Pending",
    value: 0,
    description: "",
  });
  const [statistics, setStatistics] = useState({
    totalContracts: 0,
    totalValue: 0,
    activeCount: 0,
    expiredCount: 0,
    terminatedCount: 0,
    pendingCount: 0,
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch("/api/contracts");
      const result = await response.json();
      if (result.success) {
        setContracts(result.data);
        setStatistics(result.statistics);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
      alert("Failed to fetch contracts");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Expired":
        return "bg-red-100 text-red-800";
      case "Terminated":
        return "bg-gray-100 text-gray-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "value" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!validateDates()) return;

    try {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        resetForm();
        fetchContracts(); // Refresh the list
        alert("Contract created successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating contract:", error);
      alert("Failed to create contract");
    }
  };

  const handleUpdateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;

    // Client-side validation
    if (!validateDates()) return;

    try {
      const response = await fetch("/api/contracts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingContract._id,
          ...formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        resetForm();
        fetchContracts(); // Refresh the list
        alert("Contract updated successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating contract:", error);
      alert("Failed to update contract");
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm("Are you sure you want to delete this contract?")) {
      return;
    }

    try {
      const response = await fetch("/api/contracts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: contractId }),
      });

      const result = await response.json();

      if (result.success) {
        fetchContracts(); // Refresh the list
        alert("Contract deleted successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting contract:", error);
      alert("Failed to delete contract");
    }
  };

  const validateDates = (): boolean => {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      alert("Error: End date must be after start date");
      return false;
    }
    return true;
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingContract(null);
    setFormData({
      title: "",
      counterparty: "",
      startDate: "",
      endDate: "",
      status: "Pending",
      value: 0,
      description: "",
    });
    setIsFormOpen(true);
  };

  const openEditModal = (contract: Contract) => {
    setIsEditMode(true);
    setEditingContract(contract);
    setFormData({
      title: contract.title,
      counterparty: contract.counterparty,
      startDate: contract.startDate.split("T")[0],
      endDate: contract.endDate.split("T")[0],
      status: contract.status,
      value: contract.value,
      description: contract.description || "",
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setIsEditMode(false);
    setEditingContract(null);
    setFormData({
      title: "",
      counterparty: "",
      startDate: "",
      endDate: "",
      status: "Pending",
      value: 0,
      description: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isEditMode) {
      handleUpdateContract(e);
    } else {
      handleCreateContract(e);
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contracts</h2>
          <p className="text-base font-semibold text-gray-500 mt-1">
            Contracts of clients signed paper work kept here
          </p>
        </div>
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
          <span>Add New Contract</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Contracts</h3>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.totalContracts}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.totalValue.toLocaleString("en-ZA", {
              style: "currency",
              currency: "ZAR",
            })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active</h3>
          <p className="text-2xl font-bold text-green-600">
            {statistics.activeCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {statistics.pendingCount}
          </p>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Contracts</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Counterparty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
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
              {contracts.map((contract) => (
                <tr key={contract._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contract.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contract.counterparty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(contract.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(contract.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contract.value.toLocaleString("en-ZA", {
                      style: "currency",
                      currency: "ZAR",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        contract.status
                      )}`}
                    >
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(contract)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteContract(contract._id)}
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

        {contracts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No contracts found. Add your first contract!
          </div>
        )}
      </div>

      {/* Contract Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-black">
              {isEditMode ? "Edit Contract" : "Add New Contract"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Counterparty
                </label>
                <input
                  type="text"
                  name="counterparty"
                  value={formData.counterparty}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-black">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-black">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Value (R)
                </label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
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
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
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
                  {isEditMode ? "Update Contract" : "Add Contract"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
