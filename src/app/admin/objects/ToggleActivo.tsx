"use client";

export default function ToggleActivo({
  checked,
  onChange,
  disabled,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className="inline-flex min-h-10 items-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span
        className={`relative w-9 h-5 rounded-full shrink-0 transition-colors duration-200 ${
          checked ? "bg-[#1a1a1a]" : "bg-[#e0e0e0]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      {children}
    </button>
  );
}
