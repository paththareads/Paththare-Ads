"use client";

import { useEffect, useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { Trash2, Plus } from "lucide-react";

interface PromoAd {
  id?: number;
  ad_name?: string;
  ad_image?: string;
  ad_public_id?: string;
  ad_description?: string;
  extra_notes_1?: string;
  is_active?: boolean;
  is_clickable?: boolean;
}

export default function AdminPromo() {
  const [rows, setRows] = useState<PromoAd[] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [editingPromo, setEditingPromo] = useState<PromoAd | null>(null);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const emptyPromo: PromoAd = {
    ad_name: "",
    ad_description: "",
    extra_notes_1: "",
    is_active: true,
    is_clickable: false,
  };

  const [formData, setFormData] = useState<PromoAd>(emptyPromo);

  /* ---------------- Load Data ---------------- */
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setRows(null);
    const res = await fetch("/api/promo");
    const json = await res.json();
    setRows(json.data);
  }

  /* ---------------- Delete ---------------- */
  async function deletePromo(id: number) {
    if (!confirm("Delete this promo?")) return;

    await fetch(`/api/promo?id=${id}`, {
      method: "DELETE",
    });

    loadData();
  }

  /* ---------------- Filtering ---------------- */
  const filteredData = useMemo(() => {
    if (!rows) return [];

    return rows
      .filter((row) =>
        row.ad_name?.toLowerCase().includes(search.toLowerCase()),
      )
      .filter((row) => {
        if (activeFilter === "all") return true;
        if (activeFilter === "active") return row.is_active;
        if (activeFilter === "inactive") return !row.is_active;
        return true;
      });
  }, [rows, search, activeFilter]);

  /* ---------------- Pagination ---------------- */
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilter, pageSize]);

  /* ---------------- Modal Controls ---------------- */
  function openAddModal() {
    setEditingPromo(null);
    setFormData(emptyPromo);
    setShowModal(true);
  }

  function openEditModal(promo: PromoAd) {
    setEditingPromo(promo);
    setFormData(promo);
    setShowModal(true);
  }

  async function savePromo() {
    try {
      if (editingPromo?.id) {
        await fetch("/api/promo", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch("/api/promo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      setShowModal(false);
      setEditingPromo(null);
      setFormData(emptyPromo);
      loadData();
    } catch {
      alert("Failed to save promo");
    }
  }

  async function uploadImageToCloudinary(file: File) {
    return new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      );

      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      );

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.response));
        } else {
          reject("Upload failed");
        }
      };

      xhr.onerror = () => reject("Upload failed");

      xhr.send(formData);
    });
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6">
        <h2 className="text-2xl font-bold">Promo Ads</h2>

        {/* FILTER CONTROLS */}
        {/* FILTER CONTROLS */}
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <input
            type="text"
            placeholder="Search promo by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border px-4 py-2 text-sm
      focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
      sm:max-w-md"
          />

          <div className="flex flex-wrap gap-3">
            {/* Status Filter */}
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="rounded-xl border px-4 py-2 text-sm
        focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="all">Show All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Page Size */}
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-xl border px-4 py-2 text-sm
        focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>

            {/* Add Button */}
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              style={{ background: "var(--color-primary)" }}
            >
              <Plus size={16} />
              Add Promo
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto bg-white shadow rounded-2xl mt-4">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Promo Name</th>
                <th className="px-4 py-3 text-center">Active</th>
                <th className="px-4 py-3 text-center">Clickable</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows === null ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    Loading promos...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    No promos found
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openEditModal(row)}
                    className="cursor-pointer border-t transition hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium">{row.id}</td>

                    <td className="px-4 py-3">
                      {row.ad_image && (
                        <img
                          src={row.ad_image}
                          className="h-12 w-20 object-cover rounded-lg"
                        />
                      )}
                    </td>

                    <td className="px-4 py-3">{row.ad_name}</td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          row.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {row.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          row.is_clickable
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {row.is_clickable ? "Yes" : "No"}
                      </span>
                    </td>

                    <td
                      className="px-4 py-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => deletePromo(row.id!)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

        {/* MODAL (ADD + EDIT) */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">
                {editingPromo ? "Edit Promo" : "Add New Promo"}
              </h3>

              <input
                placeholder="Promo Name"
                className="border w-full px-3 py-2 rounded"
                value={formData.ad_name}
                onChange={(e) =>
                  setFormData({ ...formData, ad_name: e.target.value })
                }
              />

              <textarea
                placeholder="Description"
                className="border w-full px-3 py-2 rounded"
                value={formData.ad_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ad_description: e.target.value,
                  })
                }
              />

              <textarea
                placeholder="Extra Notes"
                className="border w-full px-3 py-2 rounded"
                value={formData.extra_notes_1}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    extra_notes_1: e.target.value,
                  })
                }
              />

              {/* Current Image */}
              {formData.ad_image && (
                <img src={formData.ad_image} className="h-32 rounded" />
              )}

              {/* Upload */}
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  if (!e.target.files?.[0]) return;
                  setUploading(true);
                  setUploadProgress(0);

                  const result = await uploadImageToCloudinary(
                    e.target.files[0],
                  );

                  setFormData({
                    ...formData,
                    ad_image: result.secure_url,
                    ad_public_id: result.public_id,
                  });

                  setUploading(false);
                }}
              />
              <div>
                <p className="text-xs italic text-center">
                  Make sure the image is a 16:9 horizontal image
                </p>
              </div>

              {uploading && (
                <div className="w-full bg-gray-200 rounded h-3">
                  <div
                    className="bg-blue-500 h-3 rounded"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_active: e.target.checked,
                      })
                    }
                  />
                  Active
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_clickable}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_clickable: e.target.checked,
                      })
                    }
                  />
                  Clickable
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={savePromo}
                  className="px-4 py-2 text-white rounded"
                  style={{ background: "var(--color-button)" }}
                >
                  {editingPromo ? "Update Promo" : "Save Promo"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
