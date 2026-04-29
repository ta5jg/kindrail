import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KindrailSdk } from "@kindrail/sdk-ts";
import type { KrBattleSimRequest, KrBattleSimResult } from "@kindrail/protocol";
import { decodeJsonFromUrlParam, encodeJsonToUrlParam, copyToClipboard } from "./share";
import { makeRequest } from "./demoBattle";
import { exportElementToPng } from "./exportPng";
import { buildReplayFrames } from "./replay";
import { getOrCreateDeviceId, getToken, setToken } from "./device";
import { parseRunFlag, parseView, scrollToSection, stripDeepLinkParams } from "./deepLinks";
import { urlBase64ToUint8Array } from "./push";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; result: KrBattleSimResult }
  | { kind: "err"; message: string };

function nowSeed(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `web-${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

function summarize(result: KrBattleSimResult): string {
  const a = result.remaining.a;
  const b = result.remaining.b;
  const aAlive = Object.values(a).filter((hp): hp is number => typeof hp === "number" && hp > 0).length;
  const bAlive = Object.values(b).filter((hp): hp is number => typeof hp === "number" && hp > 0).length;
  return `Outcome: ${result.outcome.toUpperCase()} | ticks=${result.ticks} | alive: A=${aAlive} B=${bAlive}`;
}

export function App() {
  const sdk = useMemo(() => new KindrailSdk({ baseUrl: "http://localhost:8787" }), []);

  const [gatewayOk, setGatewayOk] = useState<boolean | null>(null);
  const [gatewayInfo, setGatewayInfo] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [currency, setCurrency] = useState<{ gold: number; shards: number; keys: number } | null>(null);
  const [catalogNameById, setCatalogNameById] = useState<Record<string, string>>({});
  const [shopOffers, setShopOffers] = useState<Array<{ offerId: string; archetype: string; priceGold: number }>>([]);
  const [owned, setOwned] = useState<Record<string, number>>({});
  const [leaderboardTop, setLeaderboardTop] = useState<Array<{ userId: string; score: number }>>([]);
  const [leaderboardMe, setLeaderboardMe] = useState<{ rank?: number; total: number; score?: number } | null>(null);
  const [shareLink, setShareLink] = useState<string>("");
  const [pushNote, setPushNote] = useState<string>("");
  const [pushBusy, setPushBusy] = useState(false);
  const [offers, setOffers] = useState<Array<{ offerId: string; name: string; priceCents: number; currency: string }>>(
    []
  );
  const autoRunConsumed = useRef(false);

  const [seed, setSeed] = useState<string>(() => {
    const url = new URL(window.location.href);
    const s = url.searchParams.get("seed");
    return s && s.length > 0 ? s : nowSeed();
  });

  const [maxTicks, setMaxTicks] = useState<number>(() => {
    const url = new URL(window.location.href);
    const mt = Number(url.searchParams.get("maxTicks") ?? "200");
    return Number.isFinite(mt) ? Math.max(1, Math.min(2000, Math.floor(mt))) : 200;
  });

  const [requestText, setRequestText] = useState<string>(() => {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("q");
    if (q) {
      try {
        const req = decodeJsonFromUrlParam<KrBattleSimRequest>(q);
        return JSON.stringify(req, null, 2);
      } catch {
        // fallthrough
      }
    }
    return JSON.stringify(makeRequest(seed, maxTicks), null, 2);
  });

  const [state, setState] = useState<LoadState>({ kind: "idle" });
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    const token = getToken();
    if (token) sdk.setToken(token);

    sdk
      .health()
      .then((h) => {
        setGatewayOk(true);
        setGatewayInfo(`${h.service} v${h.version}`);
      })
      .catch(() => {
        setGatewayOk(false);
        setGatewayInfo("gateway offline");
      });
  }, [sdk]);

  useEffect(() => {
    sdk
      .catalogUnits()
      .then((c) => {
        const map: Record<string, string> = {};
        for (const u of c.catalog.units) map[u.id] = u.name;
        setCatalogNameById(map);
      })
      .catch(() => {});

    // Auto guest login
    const deviceId = getOrCreateDeviceId();
    sdk
      .authGuest({ v: 1, deviceId })
      .then((a) => {
        setToken(a.token);
        sdk.setToken(a.token);
        setUserId(a.userId);
        return Promise.all([sdk.inventory(), sdk.shopDaily(), sdk.ownedUnits()]);
      })
      .then(([inv, shop, ownedRes]) => {
        setCurrency(inv.inventory.currency);
        setShopOffers(shop.offers.map((o) => ({ offerId: o.offerId, archetype: o.archetype, priceGold: o.priceGold })));
        const m: Record<string, number> = {};
        for (const u of ownedRes.owned) m[u.archetype] = u.level;
        setOwned(m);
      })
      .catch(() => {
        // remain logged out
      });
  }, [sdk]);

  useEffect(() => {
    const onUrl = () => {
      const url = new URL(window.location.href);
      const view = parseView(url);
      if (view) {
        requestAnimationFrame(() => scrollToSection(view));
        stripDeepLinkParams(url, ["view"]);
      }
    };
    onUrl();
    window.addEventListener("popstate", onUrl);
    window.addEventListener("kr:urlchanged", onUrl);
    return () => {
      window.removeEventListener("popstate", onUrl);
      window.removeEventListener("kr:urlchanged", onUrl);
    };
  }, []);

  useEffect(() => {
    let sub: { remove: () => Promise<void> } | undefined;
    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        sub = await App.addListener("appUrlOpen", ({ url }) => {
          try {
            const incoming = new URL(url);
            const cur = new URL(window.location.href);
            if (incoming.origin !== cur.origin) return;
            incoming.searchParams.forEach((v, k) => cur.searchParams.set(k, v));
            window.history.replaceState({}, "", cur.toString());
            window.dispatchEvent(new Event("kr:urlchanged"));
          } catch {
            // ignore
          }
        });
      } catch {
        // web-only dev
      }
    })();
    return () => {
      void sub?.remove();
    };
  }, []);

  useEffect(() => {
    sdk
      .offers()
      .then((o) => {
        setOffers(o.offers.map((x) => ({ offerId: x.offerId, name: x.name, priceCents: x.priceCents, currency: x.currency })));
      })
      .catch(() => {});
  }, [sdk]);

  useEffect(() => {
    // Referral accept via URL: ?ref=<userId>
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (!ref) return;
    if (!userId) return;
    sdk
      .referralAccept({ v: 1, referrerUserId: ref })
      .then(() => {
        url.searchParams.delete("ref");
        window.history.replaceState({}, "", url.toString());
      })
      .catch(() => {});
  }, [sdk, userId]);

  useEffect(() => {
    // After checkout redirect (devstub/stripe), refresh balances
    const url = new URL(window.location.href);
    const status = url.searchParams.get("status");
    const purchase = url.searchParams.get("purchase");
    if (!status && !purchase) return;
    url.searchParams.delete("status");
    url.searchParams.delete("purchase");
    window.history.replaceState({}, "", url.toString());
    refreshMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function syncUrlFromReq(req: KrBattleSimRequest) {
    const url = new URL(window.location.href);
    url.searchParams.set("q", encodeJsonToUrlParam(req));
    url.searchParams.set("seed", req.seed.seed);
    url.searchParams.set("maxTicks", String(req.maxTicks));
    window.history.replaceState({}, "", url.toString());
  }

  const runSim = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const req = JSON.parse(requestText) as KrBattleSimRequest;
      syncUrlFromReq(req);
      const res = await sdk.battleSim(req);
      setState({ kind: "ok", result: res });
      setTick(0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }, [sdk, requestText]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!parseRunFlag(url)) return;
    if (autoRunConsumed.current) return;
    autoRunConsumed.current = true;
    stripDeepLinkParams(url, ["run"]);
    void runSim();
  }, [runSim]);

  async function copyShareLink() {
    await copyToClipboard(window.location.href);
  }

  async function copySocialText() {
    if (state.kind !== "ok") return;
    const text = `KINDRAIL battle\n${summarize(state.result)}\n${window.location.href}`;
    await copyToClipboard(text);
  }

  function xShareUrl(): string {
    if (state.kind !== "ok") return "https://x.com/intent/tweet";
    const text = `KINDRAIL battle — ${summarize(state.result)}`;
    const url = window.location.href;
    const intent = new URL("https://x.com/intent/tweet");
    intent.searchParams.set("text", text);
    intent.searchParams.set("url", url);
    return intent.toString();
  }

  async function exportPng() {
    if (state.kind !== "ok") return;
    const el = document.getElementById("kr-share-card");
    if (!el) return;
    await exportElementToPng(el, `kindrail-battle-${seed}.png`);
  }

  async function useDailySeed() {
    try {
      const d = await sdk.dailySeed();
      setSeed(d.seed);
      const req = makeRequest(d.seed, maxTicks);
      setRequestText(JSON.stringify(req, null, 2));
      // Run immediately for 1-click share
      setState({ kind: "loading" });
      syncUrlFromReq(req);
      const res = await sdk.battleSim(req);
      setState({ kind: "ok", result: res });
      setTick(0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  async function claimDaily() {
    try {
      const res = await sdk.dailyClaim();
      setCurrency(res.inventory.currency);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  async function refreshMeta() {
    if (!userId) return;
    try {
      const [inv, shop, ownedRes] = await Promise.all([sdk.inventory(), sdk.shopDaily(), sdk.ownedUnits()]);
      setCurrency(inv.inventory.currency);
      setShopOffers(shop.offers.map((o) => ({ offerId: o.offerId, archetype: o.archetype, priceGold: o.priceGold })));
      const m: Record<string, number> = {};
      for (const u of ownedRes.owned) m[u.archetype] = u.level;
      setOwned(m);
    } catch {
      // ignore
    }
  }

  async function buy(offerId: string) {
    try {
      const res = await sdk.shopBuy({ v: 1, offerId });
      setCurrency({ gold: res.gold, shards: res.shards, keys: res.keys });
      setOwned(res.owned);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  async function upgrade(archetype: string) {
    try {
      const res = await sdk.unitUpgrade({ v: 1, archetype });
      setCurrency({ gold: res.gold, shards: res.shards, keys: res.keys });
      setOwned((o) => ({ ...o, [archetype]: res.level }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  async function refreshLeaderboard() {
    try {
      const d = await sdk.dailySeed();
      const [top, me] = await Promise.all([sdk.leaderboardDaily(d.dateUtc, 20), sdk.leaderboardMe(d.dateUtc)]);
      setLeaderboardTop(top.entries.map((e) => ({ userId: e.userId, score: e.score })));
      setLeaderboardMe({ rank: me.rank, total: me.total, score: me.entry?.score });
    } catch {
      // ignore
    }
  }

  async function submitDailyToLeaderboard() {
    try {
      const d = await sdk.dailySeed();
      const req = makeRequest(d.seed, maxTicks);
      const sim = await sdk.battleSim(req);
      setState({ kind: "ok", result: sim });
      setTick(0);

      const submit = await sdk.leaderboardSubmit({ v: 1, dateUtc: d.dateUtc, battleRequest: req });
      setLeaderboardMe({ rank: submit.rank, total: submit.total, score: submit.entry.score });
      await refreshLeaderboard();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  async function createShareTicketLink() {
    try {
      const t = await sdk.shareTicket();
      const url = new URL(window.location.href);
      url.searchParams.set("ticket", t.ticketId);
      const link = url.toString();
      setShareLink(link);
      await copyToClipboard(link);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  async function buyOffer(offerId: string) {
    try {
      const res = await sdk.checkoutCreate({ v: 1, offerId });
      window.location.href = res.url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  async function redeemTicketIfPresent() {
    const url = new URL(window.location.href);
    const ticket = url.searchParams.get("ticket");
    if (!ticket) return;
    if (!userId) return;
    try {
      await sdk.shareRedeem({ v: 1, ticketId: ticket });
      url.searchParams.delete("ticket");
      window.history.replaceState({}, "", url.toString());
      await refreshMeta();
    } catch {
      // ignore
    }
  }

  async function registerWebPush() {
    if (!userId) return;
    setPushBusy(true);
    setPushNote("");
    try {
      const v = await sdk.pushWebVapidPublic();
      if (!v.enabled || !v.publicKey) {
        setPushNote("Push is off until the gateway has KR_VAPID_PUBLIC_KEY + KR_VAPID_PRIVATE_KEY.");
        return;
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPushNote("Push not supported in this browser.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe().catch(() => {});
      const key = urlBase64ToUint8Array(v.publicKey);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer
      });
      const json = sub.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setPushNote("Subscription payload incomplete.");
        return;
      }
      await sdk.pushWebSubscribe({
        v: 1,
        subscription: {
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }
        }
      });
      setPushNote("Subscribed. Server can send daily reminders (admin/cron).");
    } catch (e) {
      setPushNote(e instanceof Error ? e.message : "Push failed.");
    } finally {
      setPushBusy(false);
    }
  }

  useEffect(() => {
    sdk
      .pushWebVapidPublic()
      .then((r) => {
        setPushNote((prev) => prev || (r.enabled ? "" : "Push: optional — configure VAPID keys on gateway to enable."));
      })
      .catch(() => {});
  }, [sdk]);

  useEffect(() => {
    redeemTicketIfPresent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const frames = state.kind === "ok" ? buildReplayFrames(state.result) : null;
  const maxTick = frames ? Math.max(0, frames.length - 1) : 0;
  const frame = frames ? frames[Math.max(0, Math.min(maxTick, tick))] : null;

  function renderFormation(req: KrBattleSimRequest) {
    const aSlots = Array.from({ length: 12 }, () => null as null | { id: string; archetype: string });
    const bSlots = Array.from({ length: 12 }, () => null as null | { id: string; archetype: string });
    for (const u of req.a.units) aSlots[u.slot ?? 0] = { id: u.id, archetype: u.archetype };
    for (const u of req.b.units) bSlots[u.slot ?? 0] = { id: u.id, archetype: u.archetype };

    const Slot = ({ v }: { v: null | { id: string; archetype: string } }) => (
      <div className="slot">
        {v ? (
          <>
            <div className="id">{v.id}</div>
            <div className="meta">{v.archetype}</div>
          </>
        ) : (
          <div className="meta">—</div>
        )}
      </div>
    );

    return (
      <div className="row" style={{ marginTop: 10 }}>
        <div className="field">
          <label>Formation A (slots 0–5 front, 6–11 back)</label>
          <div className="miniGrid">
            {aSlots.slice(0, 6).map((v, i) => (
              <Slot key={`aF${i}`} v={v} />
            ))}
            {aSlots.slice(6, 12).map((v, i) => (
              <Slot key={`aB${i}`} v={v} />
            ))}
          </div>
        </div>
        <div className="field">
          <label>Formation B</label>
          <div className="miniGrid">
            {bSlots.slice(0, 6).map((v, i) => (
              <Slot key={`bF${i}`} v={v} />
            ))}
            {bSlots.slice(6, 12).map((v, i) => (
              <Slot key={`bB${i}`} v={v} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="top">
        <div className="brand">
          <h1>KINDRAIL</h1>
          <div className="sub">
            Web-first companion client • deterministic battle sim • shareable replay links
          </div>
        </div>
        <div className="row">
          <div className="pill">
            <strong className={gatewayOk ? "ok" : gatewayOk === false ? "bad" : ""}>
              {gatewayOk === null ? "…" : gatewayOk ? "OK" : "DOWN"}
            </strong>
            <span>{gatewayInfo}</span>
          </div>
          <div className="pill">
            <strong>USER</strong>
            <span className="mono">{userId ? userId : "—"}</span>
          </div>
          <div className="pill">
            <strong>G</strong>
            <span className="mono">{currency ? currency.gold : "—"}</span>
            <strong>S</strong>
            <span className="mono">{currency ? currency.shards : "—"}</span>
            <strong>K</strong>
            <span className="mono">{currency ? currency.keys : "—"}</span>
          </div>
          <button className="btn" onClick={claimDaily} disabled={!userId}>
            Claim daily
          </button>
          <button className="btn" onClick={refreshMeta} disabled={!userId}>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="card" id="kr-section-battle">
          <h2>Battle request (SSOT JSON)</h2>

          <div className="row">
            <div className="field">
              <label>seed</label>
              <input
                value={seed}
                onChange={(e) => {
                  const s = e.target.value;
                  setSeed(s);
                  try {
                    const req = JSON.parse(requestText) as KrBattleSimRequest;
                    const next: KrBattleSimRequest = { ...req, seed: { seed: s } };
                    setRequestText(JSON.stringify(next, null, 2));
                  } catch {
                    // ignore
                  }
                }}
              />
            </div>
            <div className="field">
              <label>maxTicks</label>
              <input
                value={String(maxTicks)}
                onChange={(e) => {
                  const n = Math.max(1, Math.min(2000, Math.floor(Number(e.target.value) || 200)));
                  setMaxTicks(n);
                  try {
                    const req = JSON.parse(requestText) as KrBattleSimRequest;
                    const next: KrBattleSimRequest = { ...req, maxTicks: n };
                    setRequestText(JSON.stringify(next, null, 2));
                  } catch {
                    // ignore
                  }
                }}
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: 10 }}>
            <label>request JSON</label>
            <textarea value={requestText} onChange={(e) => setRequestText(e.target.value)} />
          </div>

          {(() => {
            try {
              const req = JSON.parse(requestText) as KrBattleSimRequest;
              return renderFormation(req);
            } catch {
              return null;
            }
          })()}

          <div className="btnbar">
            <button className="btn primary" onClick={runSim} disabled={state.kind === "loading"}>
              {state.kind === "loading" ? "Running…" : "Run battle"}
            </button>
            <button className="btn" onClick={useDailySeed} disabled={state.kind === "loading"}>
              Daily battle
            </button>
            <button
              className="btn"
              onClick={() => setRequestText(JSON.stringify(makeRequest(nowSeed(), maxTicks), null, 2))}
            >
              New demo
            </button>
            <button className="btn" onClick={copyShareLink}>
              Copy share link
            </button>
            <button className="btn" onClick={copySocialText} disabled={state.kind !== "ok"}>
              Copy social text
            </button>
            <button className="btn" onClick={exportPng} disabled={state.kind !== "ok"}>
              Export PNG
            </button>
            <a className="btn" href={xShareUrl()} target="_blank" rel="noreferrer">
              Share to X
            </a>
          </div>
        </div>

        <div className="card" id="kr-section-result">
          <h2>Result</h2>

          {state.kind === "idle" && <div className="log">Run a battle to see output.</div>}
          {state.kind === "loading" && <div className="log">Simulating…</div>}
          {state.kind === "err" && <div className="log bad">{state.message}</div>}
          {state.kind === "ok" && (
            <>
              <div className="pill" style={{ marginBottom: 10 }}>
                <strong className={state.result.outcome === "a" ? "ok" : state.result.outcome === "b" ? "bad" : ""}>
                  {state.result.outcome.toUpperCase()}
                </strong>
                <span className="mono">ticks={state.result.ticks}</span>
              </div>
              <div id="kr-share-card" className="shareCard">
                <div className="shareCardTitle">
                  <div className="k">KINDRAIL</div>
                  <div className="meta mono">{seed}</div>
                </div>
                <div className="log">{summarize(state.result)}</div>
                <div className="log" style={{ marginTop: 8, color: "rgba(255,255,255,0.72)" }}>
                  {window.location.href}
                </div>
              </div>

              <div className="timeline">
                <div className="pill">
                  <strong>Replay</strong>
                  <span className="mono">
                    tick {tick}/{maxTick}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxTick}
                  value={Math.max(0, Math.min(maxTick, tick))}
                  onChange={(e) => setTick(Math.floor(Number(e.target.value) || 0))}
                />
                <div className="log">
                  {(frame?.log ?? ["(no events)"]).join("\n")}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        <div className="card" id="kr-section-shop">
          <h2>Shop (daily)</h2>
          <div className="row">
            {shopOffers.map((o) => (
              <div key={o.offerId} className="pill">
                <strong>{catalogNameById[o.archetype] ?? o.archetype}</strong>
                <span className="mono">{o.priceGold}G</span>
                <button className="btn" onClick={() => buy(o.offerId)} disabled={!userId}>
                  Buy
                </button>
              </div>
            ))}
          </div>
          <div className="sub" style={{ marginTop: 10 }}>
            Buy unlocks a unit at level 1 (v0).
          </div>
        </div>

        <div className="card" id="kr-section-collection">
          <h2>Collection</h2>
          {Object.keys(owned).length === 0 ? (
            <div className="log">No units yet. Buy from shop.</div>
          ) : (
            <div className="row">
              {Object.entries(owned)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([arch, lvl]) => (
                  <div key={arch} className="pill">
                    <strong>{catalogNameById[arch] ?? arch}</strong>
                    <span className="mono">Lv {lvl}</span>
                    <button className="btn" onClick={() => upgrade(arch)} disabled={!userId}>
                      Upgrade
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        <div className="card" id="kr-section-monetization">
          <h2>Monetization (MVP)</h2>
          {offers.length === 0 ? (
            <div className="log">Loading offers…</div>
          ) : (
            <div className="row">
              {offers.map((o) => (
                <div key={o.offerId} className="pill">
                  <strong>{o.name}</strong>
                  <span className="mono">
                    {(o.priceCents / 100).toFixed(2)} {o.currency}
                  </span>
                  <button className="btn primary" onClick={() => buyOffer(o.offerId)} disabled={!userId}>
                    Buy
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="sub" style={{ marginTop: 10 }}>
            Dev note: without `STRIPE_SECRET_KEY`, purchases are fulfilled instantly (devstub).
          </div>
        </div>
        <div className="card">
          <h2>Purchase status</h2>
          <div className="btnbar">
            <button
              className="btn"
              onClick={async () => {
                try {
                  await sdk.purchaseStatus();
                  await refreshMeta();
                } catch {
                  // ignore
                }
              }}
              disabled={!userId}
            >
              Refresh purchase status
            </button>
          </div>
          <div className="log">Balances update immediately on success.</div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        <div className="card" id="kr-section-leaderboard">
          <h2>Daily leaderboard</h2>
          <div className="btnbar">
            <button className="btn" onClick={refreshLeaderboard} disabled={!userId}>
              Refresh leaderboard
            </button>
            <button className="btn primary" onClick={submitDailyToLeaderboard} disabled={!userId}>
              Play daily + submit
            </button>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <div className="pill">
              <strong>ME</strong>
              <span className="mono">
                {leaderboardMe ? `#${leaderboardMe.rank ?? "—"} / ${leaderboardMe.total}` : "—"}
              </span>
              <span className="mono">{leaderboardMe?.score ?? "—"}</span>
            </div>
          </div>
          <div className="log" style={{ marginTop: 10 }}>
            {leaderboardTop.length === 0
              ? "No entries yet."
              : leaderboardTop
                  .map((e, i) => `${String(i + 1).padStart(2, "0")}  ${e.userId}  score=${e.score}`)
                  .join("\n")}
          </div>
        </div>

        <div className="card" id="kr-section-share">
          <h2>Share rewards</h2>
          <div className="btnbar">
            <button className="btn" onClick={createShareTicketLink} disabled={!userId}>
              Create share ticket (copy link)
            </button>
          </div>
          {shareLink ? <div className="log" style={{ marginTop: 10 }}>{shareLink}</div> : <div className="log">—</div>}
          <div className="sub" style={{ marginTop: 10 }}>
            Tip: send the copied link to a friend. When they open it, they get a small reward and you get a small reward.
          </div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        <div className="card" id="kr-section-push">
          <h2>Push (daily reminder)</h2>
          <div className="sub" style={{ marginBottom: 10 }}>
            Web Push MVP: subscribe stores an endpoint on the gateway. Operators send with{" "}
            <span className="mono">POST /admin/push/test</span> + <span className="mono">x-kr-admin-token</span>.
          </div>
          <div className="btnbar">
            <button className="btn primary" onClick={() => void registerWebPush()} disabled={!userId || pushBusy}>
              {pushBusy ? "Working…" : "Enable push on this device"}
            </button>
          </div>
          {pushNote ? <div className="log" style={{ marginTop: 10 }}>{pushNote}</div> : null}
        </div>
      </div>

      <div style={{ marginTop: 14 }} className="pill">
        <span className="mono">
          Tip: this page URL encodes the request. Share it and anyone can replay the same deterministic battle.
        </span>
      </div>
    </div>
  );
}

