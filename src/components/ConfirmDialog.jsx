import "../styles/confirmdialog.css";

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, isDanger = false }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay">
      <div className={`confirm-dialog ${isDanger ? "danger" : ""}`}>
        <div className="confirm-header">
          <h3>{isDanger ? "⚠️" : "❓"} {title}</h3>
        </div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-footer">
          <button onClick={onCancel} className="confirm-cancel">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`confirm-action ${isDanger ? "danger" : ""}`}
          >
            {isDanger ? "🗑️ Delete" : "✓ Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
