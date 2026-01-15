"use client";
import demo from "../../data/demo.json";
import Seed from "../components/Seed";
import { LS_KEYS, readLS, writeLS } from "../components/storage";
import { useEffect, useState } from "react";
export default function Builder(){
  const [code,setCode]=useState("");
  const [authed,setAuthed]=useState(false);
  useEffect(()=>{ const sess=readLS(LS_KEYS.BUILDER_SESSION,null); if(sess?.authed) setAuthed(true); },[]);
  function login(){ if(code.trim()===demo.builderAccessCode){ writeLS(LS_KEYS.BUILDER_SESSION,{authed:true,at:Date.now()}); setAuthed(true);} else alert("Invalid builder code."); }
  function logout(){ writeLS(LS_KEYS.BUILDER_SESSION,{authed:false}); setAuthed(false); }
  if(!authed){
    return (
      <div className="card">
        <Seed />
        <h1>Builder Portal</h1>
        <div className="hint">Enter the builder access code to continue.</div>
        <div className="row" style={{marginTop:12}}>
          <input className="input" value={code} onChange={e=>setCode(e.target.value)} placeholder="Builder access code" />
          <button className="btn primary" onClick={login}>Enter</button>
        </div>
        <div className="hint" style={{marginTop:10}}>Demo code is on the Home page.</div>
      </div>
    );
  }
  return (
    <div className="card">
      <Seed />
      <div className="cardHeader">
        <div><h1>Builder Portal</h1><div className="hint">Go to Setup or Bid Analysis.</div></div>
        <button className="btn ghost" onClick={logout}>Log out</button>
      </div>
      <div className="hr"></div>
      <div className="grid3">
        <div className="card" style={{margin:0}}><h2>Setup</h2><div className="hint">Choose trades, define bid format, manage documents.</div><div style={{marginTop:12}}><a className="btn good" href="/builder/setup">Open Setup →</a></div></div>
        <div className="card" style={{margin:0}}><h2>Bid Analysis</h2><div className="hint">Compare vendors per trade & plan. Low is Avg/Plan.</div><div style={{marginTop:12}}><a className="btn good" href="/builder/analysis">Open Bid Analysis →</a></div></div>
        <div className="card" style={{margin:0}}><h2>Sub View</h2><div className="hint">Open subcontractor portal (what vendors see).</div><div style={{marginTop:12}}><a className="btn" href="/sub">Open Sub →</a></div></div>
      </div>
    </div>
  );
}