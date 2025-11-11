// app/staff/page.tsx
"use client";
import { useState, useEffect } from "react";
import { Position, Department } from "@/lib/constants/StaffMemberConstants";

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  phone?: string;
  avatar_url?: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "",
    department: "",
    phone: "",
    avatar_url: "",
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/staff-members");
      const result = await response.json();
      if (result.data) {
        setStaff(result.data);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      alert("Failed to fetch staff members");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/staff-members", {
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
          name: "",
          email: "",
          position: "",
          department: "",
          phone: "",
          avatar_url: "",
        });
        fetchStaff(); // Refresh the list
        alert("Staff member created successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating staff member:", error);
      alert("Failed to create staff member");
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    try {
      const response = await fetch("/api/staff-members", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedStaff._id,
          ...formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowEditModal(false);
        setSelectedStaff(null);
        setFormData({
          name: "",
          email: "",
          position: "",
          department: "",
          phone: "",
          avatar_url: "",
        });
        fetchStaff(); // Refresh the list
        alert("Staff member updated successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating staff member:", error);
      alert("Failed to update staff member");
    }
  };

  // In your staff page, update the handleDeleteStaff function:
  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) {
      return;
    }

    try {
      const response = await fetch(`/api/staff-members?id=${staffId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        fetchStaff(); // Refresh the list
        alert("Staff member deleted successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting staff member:", error);
      alert("Failed to delete staff member");
    }
  };

  const openEditModal = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      position: staffMember.position,
      department: staffMember.department,
      phone: staffMember.phone || "",
      avatar_url: staffMember.avatar_url || "",
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      name: "",
      email: "",
      position: "",
      department: "",
      phone: "",
      avatar_url: "",
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
        <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
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
          <span>Add Staff</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((member) => (
                <tr key={member._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {member.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.phone || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(member)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(member._id)}
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

        {staff.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No staff members found. Add your first staff member!
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-black">
              Add Staff Member
            </h3>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Position
                </label>
                <select
                  required
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="" className="text-black">
                    Select position
                  </option>
                  {Object.values(Position).map((position) => (
                    <option
                      key={position}
                      value={position}
                      className="text-black"
                    >
                      {position}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Department
                </label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="" className="text-black">
                    Select department
                  </option>
                  {Object.values(Department).map((department) => (
                    <option
                      key={department}
                      value={department}
                      className="text-black"
                    >
                      {department}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Avatar URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) =>
                    setFormData({ ...formData, avatar_url: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="https://example.com/avatar.jpg"
                />
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
                  Add Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-black">
              Edit Staff Member
            </h3>
            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Position
                </label>
                <select
                  required
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="" className="text-black">
                    Select position
                  </option>
                  {Object.values(Position).map((position) => (
                    <option
                      key={position}
                      value={position}
                      className="text-black"
                    >
                      {position}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Department
                </label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="" className="text-black">
                    Select department
                  </option>
                  {Object.values(Department).map((department) => (
                    <option
                      key={department}
                      value={department}
                      className="text-black"
                    >
                      {department}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-black">
                  Avatar URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) =>
                    setFormData({ ...formData, avatar_url: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="https://example.com/avatar.jpg"
                />
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
                  Update Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
