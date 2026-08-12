"use client";

import { useState, useEffect, useMemo } from "react";

interface PaidEmail {
  id: string;
  email: string;
  createdAt: string;
}

interface Employee {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export default function PaidEmailManagementPage() {
  // ── Paid Emails (LEFT) ───────────────────────────────────────────────────
  const [paidEmails, setPaidEmails] = useState<PaidEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // ── Employees (RIGHT) ────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Fetch paid emails
  useEffect(() => {
    const fetchPaidEmails = async () => {
      try {
        setLoadingEmails(true);
        const res = await fetch("/api/admin/paid-emails");
        if (!res.ok) throw new Error("Failed to load paid emails");
        const data = await res.json();
        setPaidEmails(data);
      } catch (err) {
        console.error(err);
        setEmailError("Could not load paid emails");
      } finally {
        setLoadingEmails(false);
      }
    };
    fetchPaidEmails();
  }, []);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const res = await fetch("/api/admin/employees");
        if (!res.ok) throw new Error("Failed to load employees");
        const data = await res.json();
        setEmployees(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const q = employeeSearch.toLowerCase();
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
    );
  }, [employees, employeeSearch]);

  // Add paid email — NO confirmation
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setAdding(true);
    setEmailError(null);
    try {
      const res = await fetch("/api/admin/paid-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add email");
      }

      const created = await res.json();
      setPaidEmails((prev) => [created, ...prev]);
      setNewEmail("");
    } catch (err: any) {
      setEmailError(err.message || "Failed to add email");
    } finally {
      setAdding(false);
    }
  };

  // Remove paid email — NO confirmation
const handleRemoveEmail = async (id: string) => {
  setRemovingId(id);
  try {
    const res = await fetch(`/api/admin/paid-emails/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to remove");
    setPaidEmails((prev) => prev.filter((e) => e.id !== id));
  } catch (err) {
    console.error(err);
  } finally {
    setRemovingId(null);
  }
};

  // Delete employee — NO confirmation, immediate API call
  const handleDeleteEmployee = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  // Export (Name + Email only)
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/employees/export");
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Paid Email Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage paid emails and view registered employees
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ═══════════════ LEFT: Paid Emails ═══════════════ */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-800">
                Paid Emails
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {paidEmails.length} email{paidEmails.length !== 1 ? "s" : ""}{" "}
                registered
              </p>
            </div>

            <div className="p-5">
              {/* Add form */}
              <form onSubmit={handleAddEmail} className="mb-5 flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="submit"
                  disabled={adding}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {adding ? (
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Adding
                    </span>
                  ) : (
                    "Add"
                  )}
                </button>
              </form>

              {emailError && (
                <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {emailError}
                </p>
              )}

              {/* List */}
              {loadingEmails ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="ml-2 text-sm">Loading…</span>
                </div>
              ) : paidEmails.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                  <p className="text-sm text-slate-400">No paid emails yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {paidEmails.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {item.email}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveEmail(item.id)}
                        disabled={removingId === item.id}
                        className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        {removingId === item.id ? (
                          <span className="inline-flex items-center gap-1">
                            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          </span>
                        ) : (
                          "Remove"
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* ═══════════════ RIGHT: Employees ═══════════════ */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  All Employees
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {employees.length} employee{employees.length !== 1 ? "s" : ""}
                </p>
              </div>

              <button
                onClick={handleExport}
                disabled={exporting || loadingEmployees || employees.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Exporting…
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export All
                  </>
                )}
              </button>
            </div>

            <div className="p-5">
              {/* Search */}
              <div className="relative mb-5">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* List */}
              {loadingEmployees ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="ml-2 text-sm">Loading employees…</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                  <p className="text-sm text-slate-400">
                    {employeeSearch
                      ? "No employees match your search"
                      : "No employees found"}
                  </p>
                </div>
              ) : (
                <ul className="max-h-[26rem] space-y-1 overflow-y-auto pr-1">
                  {filteredEmployees.map((emp) => (
                    <li
                      key={emp.id}
                      className="group flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {emp.fullName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {emp.email}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        disabled={deletingId === emp.id}
                        className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-100"
                        title="Delete employee"
                      >
                        {deletingId === emp.id ? (
                          <span className="inline-flex items-center gap-1 text-red-500">
                            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          </span>
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}