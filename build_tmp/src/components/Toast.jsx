export default function Toast({ message, type = "success" }) {
  if (!message) return null;
  const colors =
    type === "error"
      ? "bg-red-900 border-red-500"
      : type === "info"
        ? "bg-blue-900 border-blue-500"
        : "bg-green-900 border-green-500";
  return (
    <div className={`toast border ${colors}`}>{message}</div>
  );
}
