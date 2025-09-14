import DropdownSelect from "@/components/DropdownSelect";

type Conversation = { id: string; title?: string };

type Props = {
  value?: string;
  conversations: Conversation[];
  onChange?: (id: string) => void;
};

export default function ConversationsSelect({ value, conversations, onChange }: Props) {
  const options = conversations.map((c) => ({
    value: c.id,
    label: c.title && c.title.length > 60 ? `${c.title.slice(0, 57)}...` : c.title || c.id,
  }));

  return (
    <DropdownSelect
      options={options}
      value={value}
      onChange={onChange}
      ariaLabel="Conversations selector"
      placeholder="Conversations"
      triggerLabel="Conversations"
      contentClassName="min-w-[16rem] max-h-[18rem] overflow-auto"
    />
  );
}
