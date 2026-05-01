/* =============================================================================
 * File:           apps/companion-web/src/ui/HomeGate.tsx
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-05-01
 * Version:        0.2.0
 *
 * Description:
 *   Release roadmap R1.1 — landing gate before the companion dashboard.
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import React from "react";

export function HomeGate(props: {
  gatewayOk: boolean | null;
  gatewayInfo: string;
  runtimeEnvLabel?: string;
  onEnterBattle: () => void;
}) {
  const status =
    props.gatewayOk === null ? "Checking…" : props.gatewayOk ? "Connected" : "Unavailable";
  const statusClass =
    props.gatewayOk === null ? "" : props.gatewayOk ? "gameGateStatusOk" : "gameGateStatusBad";

  return (
    <main className="gameGate" aria-label="Kindrail home">
      <div className="gameGateCard">
        <div className="gameGateBrand">KINDRAIL</div>
        <p className="gameGateTagline">Async tactical squad battles — web &amp; mobile.</p>
        <button type="button" className="gameGateCta" onClick={props.onEnterBattle}>
          Enter battle
        </button>
        <p className={`gameGateStatus ${statusClass}`}>
          Gateway: <strong>{status}</strong>
          {props.gatewayInfo ? <span className="gameGateStatusMeta"> · {props.gatewayInfo}</span> : null}
        </p>
        <p className="gameGateHint">Progression, shop, and meta panels load after you enter.</p>
        <p className="gameGateMeta">
          {props.runtimeEnvLabel ? `${props.runtimeEnvLabel} · ` : null}
          Same client ships on web and in-store shells (Capacitor).
        </p>
      </div>
    </main>
  );
}
