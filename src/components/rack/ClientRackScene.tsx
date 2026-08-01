import { useEffect, useState } from "react";
import { RackScene, type ViewMode } from "./RackScene";

type Props = {
  selectedId: string | null;
  highlightKind: string | null;
  explode: boolean;
  autoRotate: boolean;
  viewMode: ViewMode;
  onSelect: (id: string | null) => void;
};

/** R3F/WebGL must mount only on the client after hydration. */
export function ClientRackScene(props: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-full min-h-[320px] w-full items-center justify-center bg-bg">
        <div className="rounded-lg border border-border bg-surface px-4 py-3 font-mono text-xs text-muted">
          Loading 3D rack model…
        </div>
      </div>
    );
  }

  return <RackScene {...props} />;
}
