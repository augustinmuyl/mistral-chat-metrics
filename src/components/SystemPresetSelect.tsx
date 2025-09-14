type Props = {
  value?: string;
  onChange?: (v: string) => void;
};

export default function SystemPresetSelect({ value, onChange }: Props) {
  return (
    <select
      className="border rounded px-2 py-1 text-sm"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      aria-label="System preset selector"
    >
      <option value="general">General</option>
      <option value="teacher">Teacher</option>
      <option value="coder">Coder</option>
      <option value="concise">Concise</option>
    </select>
  );
}

