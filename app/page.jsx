"use client";

import Seed from "./components/Seed";
import demo from "../data/demo.json";
import { LS_KEYS } from "./components/storage";

function reset(){
  if (typeof window === "undefined") return;
  Object.values(LS_KEYS).forEach(k => window.localStorage.removeItem(k));
  window.location.reload();
}

export default function Home(){
  return (
    <div className="card">
      <Seed />
      <div className="cardHeader">
        <div>
          <h1>Proof of Concept Demo</h1>
          <div className="hint">
            Single <b>Community Code</b> for subcontractor registration. Builder controls trades, bid templates, and docs.
            Bid analysis computes <b>Low</b> as <b>Avg/Plan</b> (sum of all plans ÷ # plans).
          </div>
        </div>
        <button className="btn ghost" onClick={reset}>Reset demo data</button>
      </div>

      <div className="hr"></div>

      <div className="grid2">
        <div className="card" style={{margin:0}}>
          <h2>Builder</h2>
          <div className="hint">Setup trades + templates + docs, review bid analysis, view notes, chat with vendors.</div>
          <div className="row" style={{marginTop:12}}>
            <a className="btn primary" href="/builder">Open Builder →</a>
            <a className="btn" href="/builder/setup">Setup</a>
            <a className="btn" href="/builder/analysis">Bid Analysis</a>
          </div>
          <div className="row" style={{marginTop:12}}>
            <span className="badge"><b>Builder Code:</b> {demo.builderAccessCode}</span>
          </div>
        </div>

        <div className="card" style={{margin:0}}>
          <h2>Subcontractor</h2>
          <div className="hint">Register with community code, view docs, submit bids, add notes, message builder.</div>
          <div className="row" style={{marginTop:12}}>
            <a className="btn primary" href="/sub">Open Sub Portal →</a>
          </div>
          <div className="row" style={{marginTop:12}}>
            <span className="badge"><b>Community Code:</b> {demo.communityCode}</span>
          </div>
        </div>
      </div>
    </div>
  );
}