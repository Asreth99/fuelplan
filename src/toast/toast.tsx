import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "../icons/icon";
import "./toast.css";

const TOAST_MS = 3000;

type Toast = { id: number; message: string; tone: "info" | "error" };
type ShowToast = (message: string, tone?: Toast["tone"]) => void;

const ToastContext = createContext<ShowToast>(() => {});

export const useToast = () => useContext(ToastContext);

/** Short confirmations ("Car saved") and background errors, shown at the bottom for 3 s. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const show = useCallback<ShowToast>((message, tone = "info") => setToast({ id: Date.now(), message, tone }), []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {createPortal(
        <div className="toast-region" role="status" aria-live="polite" aria-label="Notifications">
          {toast && (
            <div key={toast.id} className={`toast toast--${toast.tone}`}>
              <Icon name={toast.tone === "error" ? "info" : "check"} />
              {toast.message}
            </div>
          )}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
