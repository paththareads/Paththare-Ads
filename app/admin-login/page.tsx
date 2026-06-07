"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/admin");
      toast.success("Welcome!");
    } else {
      toast.error("The username or password you entered is incorrect!");
      setError("Invalid login");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl shadow-lg p-8 mt-2 mb-12
             bg-[#042a36]
             transition-all hover:shadow-xl"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/sample-logo-1.png"
            alt="Logo"
            width={180}
            height={70}
            className="rounded-full"
          />
        </div>

        <h1 className="text-xl font-bold text-center text-gray-500 mb-8">
          Admin Login
        </h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-1">
              Username
            </label>
            <input
              placeholder="Enter your username"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none
                         focus:ring-2 focus:ring-gray-200 transition text-amber-100"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-100 mb-1">
              Password
            </label>
            <input
              placeholder="Enter your password"
              type="password"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none
                         focus:ring-2 focus:ring-gray-200 transition text-amber-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* {error && <p className="text-red-500 text-sm">{error}</p>} */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary-dark)] text-white py-3 rounded-lg
                       font-medium text-lg transition hover:bg-[var(--color-primary)] flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-2">
          &copy; {new Date().getFullYear()} Hastec Innovations (Pvt) Ltd.
        </p>
      </form>
    </div>
  );
}
