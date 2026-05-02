

const AlertMessage = ({ type, message, onClear }) => {
  const styles = {
    container: {
      padding: "12px 20px",
      borderRadius: "8px",
      marginBottom: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      animation: "slideIn 0.3s ease-out",
      color: "#fff",
      fontSize: "14px",
      fontWeight: "500",
      // Dynamic colors based on alert type
      backgroundColor:
        type === "error"
          ? "#d32f2f"
          : type === "warning"
            ? "#ed6c02"
            : "#2e7d32",
    },
    closeBtn: {
      background: "transparent",
      border: "none",
      color: "#fff",
      cursor: "pointer",
      fontSize: "18px",
      marginLeft: "15px",
    },
  };

  return (
    <div style={styles.container}>
      <span>
        {type === "error" ? "🚫 " : type === "warning" ? "⚠️ " : "✅ "}
        {message}
      </span>
      <button style={styles.closeBtn} onClick={onClear}>
        ×
      </button>
    </div>
  );
};

export default AlertMessage;
