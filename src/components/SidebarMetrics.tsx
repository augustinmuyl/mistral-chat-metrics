type Props = {
  latencyMs?: number;
  durationMs?: number;
  reqKB?: number;
  respKB?: number;
  model?: string;
  preset?: string;
  tokens?: number;
};

export default function SidebarMetrics({
  latencyMs,
  durationMs,
  reqKB,
  respKB,
  model,
  preset,
  tokens,
}: Props) {
  return (
    <aside className="w-full lg:w-80 border-l px-4 py-4 space-y-2">
      <div className="text-sm opacity-70">Metrics</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="border rounded p-2">
          <div>Latency</div>
          <div>{latencyMs ?? "-"} ms</div>
        </div>
        <div className="border rounded p-2">
          <div>Duration</div>
          <div>{durationMs ?? "-"} ms</div>
        </div>
        <div className="border rounded p-2">
          <div>Req KB</div>
          <div>{reqKB ?? "-"}</div>
        </div>
        <div className="border rounded p-2">
          <div>Resp KB</div>
          <div>{respKB ?? "-"}</div>
        </div>
        <div className="border rounded p-2">
          <div>Model</div>
          <div>{model ?? "-"}</div>
        </div>
        <div className="border rounded p-2">
          <div>Preset</div>
          <div>{preset ?? "-"}</div>
        </div>
        <div className="border rounded p-2">
          <div>Tokens</div>
          <div>{tokens ?? "-"}</div>
        </div>
      </div>
    </aside>
  );
}
