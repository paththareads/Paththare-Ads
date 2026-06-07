"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { CheckCircle } from "lucide-react";

interface AdType {
  id?: number;
  ad_type_name: string;
  ad_type_name_code?: string;
  is_available: boolean;
  isDirty?: boolean;
}

export default function AdminSettings() {
  const [rows, setRows] = useState<AdType[] | null>(null); // null means loading
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const LIMIT = 8;

  /* ---------------- Load Data ---------------- */
  useEffect(() => {
    loadData();
  }, [currentPage]);

  async function loadData() {
    setRows(null); // trigger loading
    try {
      const res = await fetch(
        `/api/ad-types?page=${currentPage}&limit=${LIMIT}`,
      );
      const json = await res.json();
      setRows(json.data);
      setTotalPages(json.totalPages);
    } catch (err) {
      console.error(err);
      setRows([]); // fallback
    }
  }

  /* ---------------- Handlers ---------------- */
  function updateRow(index: number, field: keyof AdType, value: any) {
    if (!rows) return;
    const updated = [...rows];
    updated[index] = {
      ...updated[index],
      [field]: value,
      isDirty: true,
    };
    setRows(updated);
  }

  async function saveRow(row: AdType) {
    await fetch("/api/ad-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    loadData();
  }

  function addNewRow() {
    setRows((prev) => [
      {
        ad_type_name: "",
        ad_type_name_code: "",
        is_available: true,
        isDirty: true,
      },
      ...(prev || []),
    ]);
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6">
        <h2 className="text-2xl font-bold">Ad Types Settings</h2>

        <div className="flex justify-end">
          <button
            onClick={addNewRow}
            className="px-4 py-2 rounded text-white"
            style={{ background: "var(--color-primary)" }}
          >
            Add New Ad Type
          </button>
        </div>

        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full text-sm border-collapse">
            <thead
              className="uppercase text-xs"
              style={{ background: "var(--color-primary-accent)" }}
            >
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Ad Type Name</th>
                <th className="px-3 py-2">Ad Type Code</th>
                <th className="px-3 py-2">Available</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows === null
                ? // Skeleton Shimmer
                  Array.from({ length: LIMIT }).map((_, i) => (
                    <tr key={i} className="border-t animate-pulse">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-3 py-2">
                          <div className="h-4 w-full rounded bg-gray-200" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 text-gray-500">
                        {row.id ?? "—"}
                      </td>

                      <td className="px-3 py-2">
                        <input
                          value={row.ad_type_name}
                          onChange={(e) =>
                            updateRow(i, "ad_type_name", e.target.value)
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      </td>

                      <td className="px-3 py-2">
                        <input
                          value={row.ad_type_name_code || ""}
                          placeholder="auto generated"
                          disabled
                          onChange={(e) =>
                            updateRow(i, "ad_type_name_code", e.target.value)
                          }
                          className="border rounded px-2 py-1 w-full text-gray-600"
                        />
                      </td>

                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.is_available}
                          onChange={(e) =>
                            updateRow(i, "is_available", e.target.checked)
                          }
                        />
                      </td>

                      <td className="flex justify-center px-3 py-2 text-center">
                        <button
                          disabled={!row.isDirty}
                          onClick={() => saveRow(row)}
                          className="flex items-center gap-1 px-3 py-1 rounded text-white disabled:opacity-40"
                          style={{
                            background: "var(--color-button)",
                          }}
                        >
                          <CheckCircle size={16} />
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
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
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
