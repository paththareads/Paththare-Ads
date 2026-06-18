"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type AlertContextType = {
  showAlert: (message: string) => void;
};

const AlertContext = createContext<AlertContextType | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showAlert = (msg: string) => {
    setMessage(msg);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      {message && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-80 rounded-xl bg-[var(--color-primary-dark)] p-6 text-white shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Notice</h2>

            <p className="mb-6 text-sm">{message}</p>

            <div className="flex justify-end">
              <button
                onClick={() => setMessage(null)}
                className="rounded-full bg-[var(--color-orange-accent)] px-4 py-1.5 text-sm font-medium text-[var(--color-primary-dark)] transition hover:brightness-110"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error("useAlert must be used inside AlertProvider");
  }

  return context;
}
