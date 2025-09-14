import ModelSelector from "./ModelSelector";
import SystemPresetSelect from "./SystemPresetSelect";

type Props = {
  model: string;
  onModelChange: (v: string) => void;
  preset: string;
  onPresetChange: (v: string) => void;
  mockEnabled?: boolean;
  onClearHistory?: () => void;
};

export default function Topbar({
  model,
  onModelChange,
  preset,
  onPresetChange,
  mockEnabled,
  onClearHistory,
}: Props) {
  return (
    <div className="w-full flex items-center justify-between gap-3 py-3 px-4 border-b">
      <div className="text-lg font-semibold">Mistral Chat + Metrics</div>
      <div className="flex items-center gap-2">
        {mockEnabled ? (
          <span className="text-xs rounded bg-amber-100 text-amber-900 px-2 py-1">
            Mock mode
          </span>
        ) : null}
        <ModelSelector value={model} onChange={onModelChange} />
        <SystemPresetSelect value={preset} onChange={onPresetChange} />
        <button
          className="border rounded px-3 py-1 text-sm"
          onClick={onClearHistory}
          aria-label="Clear history"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
