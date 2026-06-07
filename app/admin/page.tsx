"use client";

import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch("/api/ads", { cache: "no-store" });
        const data = await res.json();
        setAds(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  // ----------------------------
  // GRAPH DATA PROCESSING
  // ----------------------------

  // 1. Ads Created Over Time
  const adsOverTime = Object.values(
    ads.reduce((acc: any, ad: any) => {
      const date = new Date(ad.created_at).toLocaleDateString();
      acc[date] = acc[date] || { date, count: 0 };
      acc[date].count += 1;
      return acc;
    }, {}),
  );

  // 2. Revenue Over Time
  const revenueOverTime = Object.values(
    ads.reduce((acc: any, ad: any) => {
      const date = new Date(ad.publish_date).toLocaleDateString();
      acc[date] = acc[date] || { date, revenue: 0 };
      acc[date].revenue += Number(ad.price || 0);
      return acc;
    }, {}),
  );

  // 3. Top Newspapers
  const newspapersData = Object.values(
    ads.reduce((acc: any, ad: any) => {
      const name = ad.newspaper_name || "Unknown";
      acc[name] = acc[name] || { name, count: 0 };
      acc[name].count += 1;
      return acc;
    }, {}),
  ).slice(0, 5);

  const tiles = [
    {
      name: "Advertisements",
      icon: <Newspaper size={26} />,
      redlink: "admin/advertisements/all/",
    },
    {
      name: "Newspapers",
      icon: <Newspaper size={26} />,
      redlink: "admin/newspapers/",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Sidebar (FIXED) */}
      <div className="h-full sticky top-0">
        <Sidebar />
      </div>

      {/* Main Content (SCROLLABLE ONLY THIS) */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        <h4 className="text-right font-semibold text-gray-600">
          Paththare Ads Admin
        </h4>

        <h2 className="text-2xl font-bold">Quick Links</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {tiles.map((tile) => (
            <div
              key={tile.name}
              className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-[1.03] transition"
            >
              <div className="text-blue-600 mb-3">{tile.icon}</div>
              <span className="text-lg font-semibold">{tile.name}</span>

              <button className="mt-5 w-full bg-gray-900 text-white rounded-xl py-2">
                <Link href={tile.redlink}>View {tile.name}</Link>
              </button>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mt-8">Insights</h2>

        {loading ? (
          <div className="text-gray-400">
            <h1>Loading charts...</h1>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ads Over Time */}
            <div className="bg-white p-4 rounded-2xl shadow h-80">
              <h3 className="font-semibold mb-2 text-center">Ads Over Time</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={adsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top Newspapers */}
            <div className="bg-white p-4 rounded-2xl shadow h-80">
              <h3 className="font-semibold mb-2 text-center">Top Newspapers</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={newspapersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count">
                    {newspapersData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`hsl(${(index / newspapersData.length) * 360}, 70%, 50%)`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Over Time */}
            <div className="bg-white p-4 rounded-2xl shadow h-80 col-span-2">
              <h3 className="font-semibold mb-2 text-center">
                Revenue Over Time
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
