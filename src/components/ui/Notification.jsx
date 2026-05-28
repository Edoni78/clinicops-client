import React, { useEffect } from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle } from "react-icons/fi";

const variants = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    icon: FiCheckCircle,
    iconColor: "text-emerald-500",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: FiAlertCircle,
    iconColor: "text-red-500",
  },
  info: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-800",
    icon: FiInfo,
    iconColor: "text-sky-500",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    icon: FiAlertTriangle,
    iconColor: "text-amber-500",
  },
};

const Notification = ({
  type = "info",
  message,
  visible,
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  if (!visible) return null;

  const style = variants[type] || variants.info;
  const Icon = style.icon;

  return (
    <div
      className={`
        fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-[100]
        ${style.bg} ${style.border} ${style.text}
        border rounded-2xl
        px-4 py-3.5
        shadow-card-md
        min-w-0
        animate-slide-in
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={`shrink-0 mt-0.5 ${style.iconColor}`} size={20} aria-hidden />
        <p className="text-sm font-medium flex-1 leading-snug">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 transition-opacity"
          aria-label="Mbyll"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Notification;
