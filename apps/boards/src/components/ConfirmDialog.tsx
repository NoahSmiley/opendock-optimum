import { AlertTriangle, X } from "lucide-react";
import clsx from "clsx";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-100 dark:bg-red-950",
      button: "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
    },
    warning: {
      icon: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-950",
      button: "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600",
    },
    info: {
      icon: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-950",
      button: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
    },
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-md p-1 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={clsx("rounded-full p-2", variantStyles[variant].iconBg)}>
            <AlertTriangle className={clsx("h-5 w-5", variantStyles[variant].icon)} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              "rounded-md px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50",
              variantStyles[variant].button
            )}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
