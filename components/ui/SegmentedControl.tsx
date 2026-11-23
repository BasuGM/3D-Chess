"use client";

type Option<T extends string> = { value: T; label: string };

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full border border-white/10 bg-black/30 p-0.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs tracking-wide ${selected ? "bg-ivory text-charcoal" : "text-ivory/75 hover:text-ivory"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
