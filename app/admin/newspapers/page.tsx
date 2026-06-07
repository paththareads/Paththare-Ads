"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Plus } from "lucide-react";
import AddEditModal from "./AddEditModal";

interface NewspaperItem {
  id: string;
  name: string;
  type: string;
  noColPerPage: number;
  colWidth: number;
  colHeight: number;
  minAdHeight: number;
  tintAdditionalCharge: number;
  created_at: string;
}

export default function AdminNewspapers() {
  const [list, setList] = useState<NewspaperItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<NewspaperItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_desc");

  const ITEMS_PER_ROW = {
    base: 1,
    sm: 2,
    xl: 3,
  };

  const MAX_ROWS = 3;

  const [currentPage, setCurrentPage] = useState(1);

  // Load data
  const loadData = async () => {
    setLoading(true);
    const res = await fetch("/api/newspapers");
    const data = await res.json();
    setList(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const deleteItem = async (id: string) => {
    await fetch(`/api/newspapers/${id}`, { method: "DELETE" });
    loadData();
  };

  const filteredList = list
    .filter((paper) => {
      const matchesSearch = paper.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesType =
        typeFilter === "all" || paper.type.toLowerCase() === typeFilter;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "type":
          return a.type.localeCompare(b.type);
        case "created_asc":
          return (
            new Date(a.created_at ?? 0).getTime() -
            new Date(b.created_at ?? 0).getTime()
          );
        case "created_desc":
        default:
          return (
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime()
          );
      }
    });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, sortBy]);

  const getColumns = () => {
    if (typeof window === "undefined") return 1;
    if (window.innerWidth >= 1280) return 3; // xl
    if (window.innerWidth >= 640) return 2; // sm
    return 1;
  };

  const [columns, setColumns] = useState(getColumns());

  useEffect(() => {
    const onResize = () => setColumns(getColumns());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const itemsPerPage = columns * MAX_ROWS;

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  function NewspaperSkeleton() {
    return (
      <div className="animate-pulse rounded-2xl border bg-white p-6">
        <div className="h-4 w-2/3 rounded bg-gray-200 mb-2" />
        <div className="h-3 w-1/3 rounded bg-gray-200 mb-4" />

        <div className="h-px w-full bg-gray-200 mb-4" />

        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-gray-200" />
          <div className="h-3 w-5/6 rounded bg-gray-200" />
          <div className="h-3 w-4/6 rounded bg-gray-200" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="h-9 rounded-lg bg-gray-200" />
          <div className="h-9 rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Newspaper Management</h2>
          <button
            onClick={() => {
              setEditItem(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow"
          >
            <Plus className="w-5 h-5" /> Add Newspaper
          </button>
        </div>

        {/* Filter/sort bar */}
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <input
            type="text"
            placeholder="Search newspaper name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-xs"
          />

          <div className="flex flex-wrap gap-3">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="sunday">Sunday</option>
              <option value="monthly">Monthly</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
              <option value="type">Type</option>
            </select>
          </div>

          {/* Result Count */}
          <div className="text-sm text-gray-500">
            {filteredList.length} result(s)
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <NewspaperSkeleton key={i} />
              ))
            : paginatedList.map((paper) => (
                <div
                  key={paper.id}
                  className="group relative flex flex-col rounded-2xl border border-[rgba(0,0,0,0.05)] bg-white p-6 transition
                 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-[var(--color-primary-dark)]">
                      {paper.name}
                    </h3>
                    <p className="mt-0.5 text-sm capitalize text-[var(--color-text-highlight)]">
                      {paper.type}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="mb-4 h-px w-full bg-[var(--color-orange-accent)] opacity-40" />

                  {/* Meta Info */}
                  {/* <div className="flex flex-col gap-2 text-sm text-[var(--color-text)]">
                <div className="flex justify-between">
                  <span className="opacity-70">Columns</span>
                  <span className="font-medium">{paper.noColPerPage}</span>
                </div>

                <div className="flex justify-between">
                  <span className="opacity-70">Size</span>
                  <span className="font-medium">
                    {paper.colWidth} × {paper.colHeight}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="opacity-70">Min Ad Height</span>
                  <span className="font-medium">{paper.minAdHeight} cm</span>
                </div>

                <div className="flex justify-between">
                  <span className="opacity-70">Tint Charge</span>
                  <span className="font-medium">
                    Rs. {paper.tintAdditionalCharge}
                  </span>
                </div>
              </div> */}

                  {/* Actions */}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setEditItem(paper);
                        setModalOpen(true);
                      }}
                      className="rounded-lg border border-[var(--color-primary)] px-4 py-2 text-sm font-medium
                     text-[var(--color-primary-dark)] transition
                     hover:bg-[var(--color-primary-accent)] hover:text-white"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => setConfirmDeleteId(paper.id)}
                      className="rounded-lg bg-[var(--color-primary-dark)] px-4 py-2 text-sm font-medium
     text-white transition hover:bg-[var(--color-primary)]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
        </div>

        {!loading && filteredList.length === 0 && (
          <div className="col-span-full rounded-xl bg-white p-10 text-center text-gray-500">
            No newspapers found
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    page === currentPage
                      ? "bg-blue-600 text-white"
                      : "border hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {modalOpen && (
        <AddEditModal
          item={editItem}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            loadData();
          }}
        />
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--color-primary-dark)]">
              Confirm Delete
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete this newspaper? This action cannot
              be undone.
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
    </div>
  );
}
