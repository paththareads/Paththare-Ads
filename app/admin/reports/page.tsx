// app/admin/payments/page.tsx

export default function AdminReports() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Payments Dashboard</h1>

      <p className="mt-4 text-gray-600">
        This is a sample page to ensure Vercel detects this file as a module.
      </p>

      <div className="mt-6 rounded-lg border p-4 shadow-sm">
        <p>No payment records found.</p>
      </div>
    </div>
  );
}
