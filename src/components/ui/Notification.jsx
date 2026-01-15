import React, { useEffect } from "react";

const variants = {
  success: {
    bg: "bg-green-50",
    border: "border-green-400",
    text: "text-green-700",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-400",
    text: "text-red-700",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-700",
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-400",
    text: "text-yellow-700",
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

  const style = variants[type];

  return (
    <div
      className={`
        fixed top-6 right-6 z-50
        ${style.bg} ${style.border} ${style.text}
        border-l-4
        px-5 py-4
        rounded-lg
        shadow-lg
        min-w-[280px]
        animate-slide-in
      `}
    >
      <div className="flex justify-between items-start gap-4">
        <p className="text-sm font-medium">{message}</p>

        <button
          onClick={onClose}
          className="text-lg leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Notification;
