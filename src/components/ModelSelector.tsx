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
      <option value="mistral-small">mistral-small</option>
      <option value="mistral-medium">mistral-medium</option>
      <option value="mistral-large">mistral-large</option>
    </select>
  );
}

