import { useEffect } from "react";
import "../styles/toast.css";

function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    console.log("Toast showing:", message, type);
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose, message, type]);

  const icons = {
    success: "✅",
    error: "❌",
    update: "📝",
    delete: "🗑️",
    info: "ℹ️",
  };

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{icons[type] || icons.info}</span>
      <span className="toast-message">{message}</span>
    </div>
  );
}

export default Toast;
