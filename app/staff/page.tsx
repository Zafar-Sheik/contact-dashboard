// app/staff/page.tsx
"use client";
import { useState, useEffect } from "react";
import { Position, Department } from "@/lib/constants/StaffMemberConstants";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Mail,
  Phone,
  User,
  Briefcase,
  Building,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/utils/toast";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

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
      showError("Failed to fetch staff members");
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
        fetchStaff();
        showSuccess("Staff member created successfully!");
      } else {
        showError(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating staff member:", error);
      showError("Failed to create staff member");
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
        fetchStaff();
        showSuccess("Staff member updated successfully!");
      } else {
        showError(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating staff member:", error);
      showError("Failed to update staff member");
    }
  };

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
        fetchStaff();
        showSuccess("Staff member deleted successfully!");
      } else {
        showError(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting staff member:", error);
      showError("Failed to delete staff member");
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

  const getDepartmentColor = (department: string) => {
    const colors = {
      [Department.CUSTOMER_SUPPORT]:
        "bg-blue-100 text-blue-800 border-blue-200",
      [Department.HARDWARE]: "bg-purple-100 text-purple-800 border-purple-200",
      [Department.MANAGEMENT]: "bg-green-100 text-green-800 border-green-200",
      [Department.SOFTWARE]: "bg-orange-100 text-orange-800 border-orange-200",
    };
    return (
      colors[department as Department] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      departmentFilter === "all" || member.department === departmentFilter;
    return matchesSearch && matchesDepartment;
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
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-gray-700 mt-1">
            Manage your team members and their details
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search staff members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-700" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
          >
            <option value="all">All Departments</option>
            {Object.values(Department).map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((member) => (
          <div
            key={member._id}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {member.name}
                  </h3>
                  <p className="text-gray-700 text-sm">{member.position}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(member)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit staff member"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteStaff(member._id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete staff member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="truncate">{member.email}</span>
              </div>

              {member.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{member.phone}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Building className="w-4 h-4 text-gray-500" />
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getDepartmentColor(
                    member.department
                  )}`}
                >
                  {member.department}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredStaff.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="text-gray-600 mb-2">No staff members found</div>
            <p className="text-gray-700 text-sm mb-4">
              {searchTerm || departmentFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first staff member"}
            </p>
            {!searchTerm && departmentFilter === "all" && (
              <button
                onClick={openCreateModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff Member</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create & Edit Modals */}
      {(showCreateModal || (showEditModal && selectedStaff)) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showCreateModal ? "Add Staff Member" : "Edit Staff Member"}
            </h3>
            <form
              onSubmit={showCreateModal ? handleCreateStaff : handleUpdateStaff}
              className="space-y-4"
            >
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  placeholder="Enter full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  placeholder="Enter email address"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Position
                </label>
                <select
                  required
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" className="text-gray-500">
                    Select position
                  </option>
                  {Object.values(Position).map((position) => (
                    <option
                      key={position}
                      value={position}
                      className="text-gray-900"
                    >
                      {position}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Department
                </label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" className="text-gray-500">
                    Select department
                  </option>
                  {Object.values(Department).map((department) => (
                    <option
                      key={department}
                      value={department}
                      className="text-gray-900"
                    >
                      {department}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Avatar URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) =>
                    setFormData({ ...formData, avatar_url: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showCreateModal ? "Add Staff" : "Update Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}