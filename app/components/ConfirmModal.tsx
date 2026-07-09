"use client";

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.9)",
        }}
      >
        <h2
          className="mb-2 text-2xl font-black tracking-[-0.04em]"
          style={{ color: "#183b32" }}
        >
          {title}
        </h2>

        <p className="mb-6 text-sm font-medium" style={{ color: "#2f5b4d" }}>
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl px-5 py-2.5 text-sm font-bold transition hover:bg-[#8fb59c]/20"
            style={{ color: "#2f5b4d" }}
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#d46b94" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}