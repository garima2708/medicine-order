"use client";

import { useState } from "react";

type EnvDebugButtonProps = {
  env: Record<string, string | undefined>;
};

export default function EnvDebugButton({ env }: EnvDebugButtonProps) {
  const [open, setOpen] = useState(false);

  const publicEnv = Object.fromEntries(
    Object.entries(env).filter(([key]) => key.startsWith("NEXT_PUBLIC_")),
  );
  const serverEnv = Object.fromEntries(
    Object.entries(env).filter(([key]) => !key.startsWith("NEXT_PUBLIC_")),
  );

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        env
      </button>

      {open ? (
        <div className="mt-3 space-y-4 rounded-lg border border-slate-200 bg-white p-4 text-xs">
          <div>
            <h3 className="mb-2 font-semibold text-slate-900">
              NEXT_PUBLIC variables
            </h3>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded bg-slate-50 p-3 text-slate-700">
              {JSON.stringify(publicEnv, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-slate-900">
              Server variables
            </h3>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded bg-slate-50 p-3 text-slate-700">
              {JSON.stringify(serverEnv, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
