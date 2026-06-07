"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { Plus } from "lucide-react";
import AddEditUserModal from "./AddEditUserModal";
import RoleCheck from "../../components/RoleCheck";

interface UserItem {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string;
  phone: string | null;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export default function AdminUsers() {
  const [list, setList] = useState<UserItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [searchName, setSearchName] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load data
  const loadData = async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();
    setList(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const deleteItem = async (id: string) => {
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    loadData();
  };

  // Filter + search
  const filteredList = list.filter((user) => {
    const matchesRole = filterRole === "ALL" || user.role === filterRole;
    const matchesSearch =
      !searchName ||
      user.full_name?.toLowerCase().includes(searchName.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchName.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedUsers = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Skeleton
  function UserSkeleton() {
    return (
      <tr className="animate-pulse">
        {Array.from({ length: 7 }).map((_, i) => (
          <td key={i} className="px-4 py-2">
            <div className="h-3 bg-gray-200 rounded w-full" />
          </td>
        ))}
      </tr>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <RoleCheck allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
        <Sidebar />

        <main className="flex-1 p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">User Management</h2>
            <button
              onClick={() => {
                setEditItem(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow"
            >
              <Plus className="w-5 h-5" /> Add User
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <select
              className="border px-4 py-2 rounded"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="MODERATOR">Moderator</option>
              <option value="PREMIUM">Premium</option>
              <option value="USER">User</option>
            </select>

            <input
              type="text"
              placeholder="Search by name or username"
              className="border px-4 py-2 rounded flex-1"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white shadow rounded-lg mt-4">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <UserSkeleton key={i} />
                    ))
                  : paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => {
                          setEditItem(user);
                          setModalOpen(true);
                        }}
                        className="hover:bg-blue-50 cursor-pointer border-b"
                      >
                        <td className="px-4 py-2">{user.full_name}</td>
                        <td className="px-4 py-2">{user.username}</td>
                        <td className="px-4 py-2">{user.email}</td>
                        <td className="px-4 py-2">{user.phone}</td>
                        <td className="px-4 py-2">{user.role}</td>
                        <td className="px-4 py-2 font-semibold">
                          {user.is_verified ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-2 font-semibold">
                          {user.is_active ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-2">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages || 1}
            </span>

            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>

              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </main>

        {/* Add/Edit Modal */}
        {modalOpen && (
          <AddEditUserModal
            user={editItem}
            onClose={() => {
              setModalOpen(false);
              setEditItem(null);
              loadData();
            }}
          />
        )}

        {/* Confirm Delete */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-[var(--color-primary-dark)]">
                Confirm Delete
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete this user? This action cannot be
                undone.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm
             transition hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    await deleteItem(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium
             text-white transition hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </RoleCheck>
    </div>
  );
}
