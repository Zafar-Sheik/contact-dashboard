// app/budget-tracker/page.tsx
"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Calendar,
  PieChart,
  DollarSign,
  Filter,
} from "lucide-react";

interface BudgetEntry {
  _id: string;
  category: string;
  amount: number;
  month: string;
  year: number;
  created_at: string;
}

export default function BudgetTracker() {
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    category: "",
    amount: 0,
    month: "",
    year: new Date().getFullYear(),
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    fetchBudgetEntries();
  }, []);

  const fetchBudgetEntries = async () => {
    try {
      const response = await fetch("/api/budget-tracker");
      const result = await response.json();
      if (result.success) {
        setBudgetEntries(result.data);
      }
    } catch (error) {
      console.error("Error fetching budget entries:", error);
      alert("Failed to fetch budget entries");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "amount" || name === "year" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleAddBudgetEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/budget-tracker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        resetForm();
        fetchBudgetEntries();
        alert("Budget entry created successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating budget entry:", error);
      alert("Failed to create budget entry");
    }
  };

  const handleUpdateBudgetEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    try {
      const response = await fetch("/api/budget-tracker", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingEntry._id,
          ...formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        resetForm();
        fetchBudgetEntries();
        alert("Budget entry updated successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating budget entry:", error);
      alert("Failed to update budget entry");
    }
  };

  const handleDeleteBudgetEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this budget entry?")) {
      return;
    }

    try {
      const response = await fetch("/api/budget-tracker", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: entryId }),
      });

      const result = await response.json();

      if (result.success) {
        fetchBudgetEntries();
        alert("Budget entry deleted successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting budget entry:", error);
      alert("Failed to delete budget entry");
    }
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingEntry(null);
    setFormData({
      category: "",
      amount: 0,
      month: "",
      year: new Date().getFullYear(),
    });
    setIsFormOpen(true);
  };

  const openEditModal = (entry: BudgetEntry) => {
    setIsEditMode(true);
    setEditingEntry(entry);
    setFormData({
      category: entry.category,
      amount: entry.amount,
      month: entry.month,
      year: entry.year,
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setIsEditMode(false);
    setEditingEntry(null);
    setFormData({
      category: "",
      amount: 0,
      month: "",
      year: new Date().getFullYear(),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isEditMode) {
      handleUpdateBudgetEntry(e);
    } else {
      handleAddBudgetEntry(e);
    }
  };

  // Calculate statistics
  const filteredEntries = budgetEntries.filter((entry) => {
    const matchesMonth = monthFilter === "all" || entry.month === monthFilter;
    const matchesYear =
      yearFilter === "all" || entry.year.toString() === yearFilter;
    return matchesMonth && matchesYear;
  });

  const totalBudget = filteredEntries.reduce(
    (sum, entry) => sum + entry.amount,
    0
  );
  const averageBudget =
    filteredEntries.length > 0 ? totalBudget / filteredEntries.length : 0;

  const currentMonth = new Date().toLocaleString("default", { month: "long" });
  const currentYear = new Date().getFullYear();

  const uniqueYears = [
    ...new Set(budgetEntries.map((entry) => entry.year.toString())),
  ].sort((a, b) => parseInt(b) - parseInt(a));

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Marketing: "bg-blue-100 text-blue-800 border-blue-200",
      Development: "bg-green-100 text-green-800 border-green-200",
      Operations: "bg-purple-100 text-purple-800 border-purple-200",
      Sales: "bg-orange-100 text-orange-800 border-orange-200",
      HR: "bg-pink-100 text-pink-800 border-pink-200",
      IT: "bg-red-100 text-red-800 border-red-200",
      Training: "bg-indigo-100 text-indigo-800 border-indigo-200",
      Travel: "bg-teal-100 text-teal-800 border-teal-200",
    };
    return colors[category] || "bg-gray-100 text-gray-800 border-gray-200";
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
          <h2 className="text-2xl font-bold text-gray-900">Budget Tracker</h2>
          <p className="text-gray-700 mt-1">
            Monitor and manage your budget allocations
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Total Budget
            </h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totalBudget.toLocaleString("en-ZA", {
              style: "currency",
              currency: "ZAR",
            })}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {filteredEntries.length} entries
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Average Entry
            </h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {averageBudget.toLocaleString("en-ZA", {
              style: "currency",
              currency: "ZAR",
            })}
          </p>
          <p className="text-sm text-gray-600 mt-1">Per category</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Current Period
            </h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {currentMonth} {currentYear}
          </p>
          <p className="text-sm text-gray-600 mt-1">Active month</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-700" />
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
          >
            <option value="all">All Months</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
        >
          <option value="all">All Years</option>
          {uniqueYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Budget Entries Grid */}
      <div className="grid gap-4">
        {filteredEntries.map((entry) => (
          <div
            key={entry._id}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {entry.category}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                      entry.category
                    )}`}
                  >
                    {entry.category}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-lg">
                      {entry.amount.toLocaleString("en-ZA", {
                        style: "currency",
                        currency: "ZAR",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>
                      {entry.month} {entry.year}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => openEditModal(entry)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit entry"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteBudgetEntry(entry._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <div className="text-gray-600 mb-2">No budget entries found</div>
            <p className="text-gray-700 text-sm mb-4">
              {monthFilter !== "all" || yearFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first budget entry"}
            </p>
            {monthFilter === "all" && yearFilter === "all" && (
              <button
                onClick={openCreateModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Budget Entry</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Budget Entry Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isEditMode ? "Edit Budget Entry" : "Add New Budget Entry"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  placeholder="Enter category name"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Amount (ZAR)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Month */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Month
                </label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" className="text-gray-500">
                    Select Month
                  </option>
                  {months.map((month) => (
                    <option key={month} value={month} className="text-gray-900">
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                  min="2000"
                  max="2100"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  {isEditMode ? "Update Entry" : "Add Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
