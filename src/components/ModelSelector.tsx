import DropdownSelect from "@/components/DropdownSelect";

type Props = {
  value?: string;
  onChange?: (v: string) => void;
};

export default function ModelSelector({ value, onChange }: Props) {
  const options = [
    { label: "mistral-large-latest", value: "mistral-large-latest" },
    { label: "mistral-small-latest", value: "mistral-small-latest" },
  ];

  return (
    <DropdownSelect
      options={options}
      value={value}
      onChange={onChange}
      ariaLabel="Model selector"
    />
  );
}
