"use client";

import { useState } from "react";

interface Props {
  user: any | null;
  onClose: () => void;
}

export default function AddEditUserModal({ user, onClose }: Props) {
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [role, setRole] = useState(user?.role || "USER");
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [isVerified, setIsVerified] = useState(user?.is_verified ?? false);

  const handleSubmit = async () => {
    const body = {
      fullName,
      username,
      email,
      phone,
      role,
      isActive,
      isVerified,
      password,
    };

    const url = user ? `/api/users/${user.id}` : "/api/users";
    const method = user ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--color-primary-dark)] mb-4">
          {user ? "Edit User" : "Add User"}
        </h3>

        <div className="space-y-3">
          <input
            className="w-full border px-4 py-2 rounded"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input
            className="w-full border px-4 py-2 rounded"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="w-full border px-4 py-2 rounded"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full border px-4 py-2 rounded"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="w-full border px-4 py-2 rounded"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <select
            className="w-full border px-4 py-2 rounded"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="MODERATOR">Moderator</option>
            <option value="PREMIUM">Premium</option>
            <option value="USER">User</option>
          </select>

          <div className="flex gap-4">
            <label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => setIsActive(!isActive)}
              />{" "}
              Active
            </label>
            <label>
              <input
                type="checkbox"
                checked={isVerified}
                onChange={() => setIsVerified(!isVerified)}
              />{" "}
              Verified
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm
             transition hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium
             text-white transition hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
