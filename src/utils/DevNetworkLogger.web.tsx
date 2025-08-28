// Web implementation: no-op stand-ins so bundlers don't try to include native-only code
import React from "react";

export function startNetworkLogging() {
  // no-op on web
}

const NetworkLogger = () => {
  return (
    <div style={{ color: "#fff", background: "#111827", padding: 16 }}>
      <strong>Network Logger</strong>
      <div>Not available on web build.</div>
    </div>
  );
};

export default NetworkLogger;
