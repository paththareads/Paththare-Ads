"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";

export default function AdminInfo() {
  const [form, setForm] = useState({
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // fetch config
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/phone");
        const data = await res.json();

        setForm({
          phone: data.phone || "",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/phone", {
        method: "POST",
        body: JSON.stringify({ phone: form.phone }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed");

      alert("Settings updated!");
    } catch (err) {
      alert("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <h2 className="text-xl font-semibold mb-6">Admin Settings</h2>

        {fetching ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6 max-w-2xl">
            {/* Section Title */}
            <h3 className="text-md font-medium mb-4 text-gray-700">
              Contact Information
            </h3>

            {/* Phone Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Phone Number{""}
                <br />
                <span className="text-xs font-normal">
                  System sends SMS directed to Administrator to this number
                </span>
              </label>

              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Enter phone number"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none border-gray-300"
              />
            </div>

            {/* Future Fields Placeholder */}
            {/* 
            <div className="mb-4">
              <label>Email</label>
              <input ... />
            </div> 
            */}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-[var(--color-primary-accent)] text-white text-sm disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
