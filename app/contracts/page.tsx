// app/contracts/page.tsx
"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  FileText,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Expired":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "Terminated":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "Pending":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 border-green-200";
      case "Expired":
        return "bg-red-100 text-red-800 border-red-200";
      case "Terminated":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
        fetchContracts();
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
        fetchContracts();
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
        fetchContracts();
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

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.counterparty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isContractExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isContractExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Contracts</h2>
          <p className="text-gray-700 mt-1">
            Manage client contracts and agreements
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Contract</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Total Contracts
            </h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.totalContracts}
          </p>
          <p className="text-sm text-gray-600 mt-1">All contracts</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Total Value</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.totalValue.toLocaleString("en-ZA", {
              style: "currency",
              currency: "ZAR",
            })}
          </p>
          <p className="text-sm text-gray-600 mt-1">Combined value</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Active</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {statistics.activeCount}
          </p>
          <p className="text-sm text-gray-600 mt-1">Current contracts</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {statistics.pendingCount}
          </p>
          <p className="text-sm text-gray-600 mt-1">Awaiting action</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search contracts..."
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
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Expired">Expired</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="grid gap-4">
        {filteredContracts.map((contract) => {
          const isExpiringSoon = isContractExpiringSoon(contract.endDate);
          const isExpired = isContractExpired(contract.endDate);

          return (
            <div
              key={contract._id}
              className={`bg-white rounded-xl border p-4 hover:shadow-md transition-shadow ${
                isExpiringSoon
                  ? "border-orange-300 bg-orange-50"
                  : isExpired
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {contract.title}
                    </h3>
                    <span
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        contract.status
                      )}`}
                    >
                      {getStatusIcon(contract.status)}
                      {contract.status}
                    </span>
                    {isExpiringSoon && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-orange-300 bg-orange-100 text-orange-800">
                        <AlertTriangle className="w-3 h-3" />
                        Expiring Soon
                      </span>
                    )}
                    {isExpired && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-red-300 bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3" />
                        Expired
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-700 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        Counterparty:
                      </span>
                      <span>{contract.counterparty}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">Start:</span>
                      <span>
                        {new Date(contract.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">End:</span>
                      <span>
                        {new Date(contract.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">Value:</span>
                      <span className="font-semibold">
                        {contract.value.toLocaleString("en-ZA", {
                          style: "currency",
                          currency: "ZAR",
                        })}
                      </span>
                    </div>
                  </div>

                  {contract.description && (
                    <div className="mt-2">
                      <p className="text-gray-700 text-sm">
                        {contract.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openEditModal(contract)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit contract"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteContract(contract._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete contract"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredContracts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <div className="text-gray-600 mb-2">No contracts found</div>
            <p className="text-gray-700 text-sm mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first contract"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <button
                onClick={openCreateModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Contract</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contract Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isEditMode ? "Edit Contract" : "Add New Contract"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Contract Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  placeholder="Enter contract title"
                />
              </div>

              {/* Counterparty */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Counterparty
                </label>
                <input
                  type="text"
                  name="counterparty"
                  value={formData.counterparty}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  placeholder="Enter counterparty name"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Value */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Contract Value (ZAR)
                </label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
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
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  placeholder="Enter contract description"
                />
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
