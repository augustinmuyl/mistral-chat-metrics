import DropdownSelect from "@/components/DropdownSelect";

type Props = {
  value?: string;
  onChange?: (v: string) => void;
};

export default function SystemPresetSelect({ value, onChange }: Props) {
  const options = [
    { value: "general", label: "General" },
    { value: "teacher", label: "Teacher" },
    { value: "coder", label: "Coder" },
    { value: "concise", label: "Concise" },
  ];

  return (
    <DropdownSelect
      options={options}
      value={value}
      onChange={onChange}
      ariaLabel="System preset selector"
    />
  );
}
