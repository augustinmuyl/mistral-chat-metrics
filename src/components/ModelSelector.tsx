type Props = {
  value?: string;
  onChange?: (v: string) => void;
};

export default function ModelSelector({ value, onChange }: Props) {
  return (
    <select
      className="border rounded px-2 py-1 text-sm"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      aria-label="Model selector"
    >
      <option value="mistral-large-latest">mistral-large-latest</option>
      <option value="mistral-small-latest">mistral-small-latest</option>
    </select>
  );
}
