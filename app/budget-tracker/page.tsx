// app/budget-tracker/page.tsx
"use client";
import { useState, useEffect } from "react";

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
  const [formData, setFormData] = useState({
    category: "",
    amount: 0,
    month: "",
    year: new Date().getFullYear(),
  });
  const [totalBudget, setTotalBudget] = useState(0);

  useEffect(() => {
    fetchBudgetEntries();
  }, []);

  const fetchBudgetEntries = async () => {
    try {
      const response = await fetch("/api/budget-tracker");
      const result = await response.json();
      if (result.success) {
        setBudgetEntries(result.data);
        setTotalBudget(result.totalAmount);
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
        fetchBudgetEntries(); // Refresh the list
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
        fetchBudgetEntries(); // Refresh the list
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
        fetchBudgetEntries(); // Refresh the list
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

  const currentMonth = new Date().toLocaleString("default", { month: "long" });
  const currentYear = new Date().getFullYear();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Budget Tracker</h2>
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
          <span>Add New Entry</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">
          Current Month's Overview ({currentMonth} {currentYear})
        </h3>
        <p className="text-3xl font-bold text-gray-900 mb-4">
          Total Expenses:{" "}
          {totalBudget.toLocaleString("en-ZA", {
            style: "currency",
            currency: "ZAR",
          })}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Budget Entries</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {budgetEntries.map((entry) => (
                <tr key={entry._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.amount.toLocaleString("en-ZA", {
                      style: "currency",
                      currency: "ZAR",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(entry)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBudgetEntry(entry._id)}
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

        {budgetEntries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No budget entries found. Add your first budget entry!
          </div>
        )}
      </div>

      {/* Budget Entry Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-black">
              {isEditMode ? "Edit Budget Entry" : "Add New Budget Entry"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Amount (R)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Month
                </label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="" className="text-black">
                    Select Month
                  </option>
                  {[
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
                  ].map((month) => (
                    <option key={month} value={month} className="text-black">
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
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
