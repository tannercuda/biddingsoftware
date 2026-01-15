"use client";
import Seed from "../../components/Seed";
import demo from "../../../data/demo.json";
import Modal from "../../components/Modal";
import { LS_KEYS, readLS, writeLS, uid, nowISO } from "../../components/storage";
import { useEffect, useMemo, useState } from "react";

export default function Setup(){
  const [cfg,setCfg]=useState(null);
  const [docs,setDocs]=useState([]);
  const [tpls,setTpls]=useState({});
  const [openTrade,setOpenTrade]=useState(null);

  useEffect(()=>{
    setCfg(readLS(LS_KEYS.COMMUNITY_CONFIG,null));
    setDocs(readLS(LS_KEYS.DOCS,[]));
    setTpls(readLS(LS_KEYS.TEMPLATES,{}));
  },[]);

  const tradeCatalog = demo.tradeCatalog;

  function toggleTrade(id){
    const next={...cfg};
    const s=new Set(next.tradesNeeded||[]);
    if(s.has(id)) s.delete(id); else s.add(id);
    next.tradesNeeded=Array.from(s);
    setCfg(next); writeLS(LS_KEYS.COMMUNITY_CONFIG,next);
  }
  function setMode(tradeId,mode){
    const next={...tpls};
    next[tradeId]=next[tradeId]||{mode:"lumpsum",items:[]};
    next[tradeId].mode=mode;
    setTpls(next); writeLS(LS_KEYS.TEMPLATES,next);
  }
  function addItem(tradeId){
    const next={...tpls};
    next[tradeId]=next[tradeId]||{mode:"lineitems",items:[]};
    const qtyByPlan={}; (cfg?.plans||demo.plans).forEach(p=>qtyByPlan[p.id]=1);
    next[tradeId].items=[...(next[tradeId].items||[]),{id:uid("it"),name:"",uom:"EA",qtyByPlan}];
    next[tradeId].mode="lineitems";
    setTpls(next); writeLS(LS_KEYS.TEMPLATES,next);
  }
  function updateItem(tradeId,itemId,patch){
    const next={...tpls};
    next[tradeId].items=(next[tradeId]?.items||[]).map(it=>it.id===itemId?{...it,...patch}:it);
    setTpls(next); writeLS(LS_KEYS.TEMPLATES,next);
  }
  function removeItem(tradeId,itemId){
    const next={...tpls};
    next[tradeId].items=(next[tradeId]?.items||[]).filter(it=>it.id!==itemId);
    setTpls(next); writeLS(LS_KEYS.TEMPLATES,next);
  }
  function addDoc(){
    const title=prompt("Document title"); if(!title) return;
    const url=prompt("Optional URL (blank ok):","")||"";
    const next=[...docs,{id:uid("doc"),title,url,updatedAt:nowISO()}];
    setDocs(next); writeLS(LS_KEYS.DOCS,next);
  }
  function editDoc(doc){
    const title=prompt("Update title:",doc.title); if(!title) return;
    const url=prompt("Update URL:",doc.url||"")||"";
    const next=docs.map(d=>d.id===doc.id?{...d,title,url,updatedAt:nowISO()}:d);
    setDocs(next); writeLS(LS_KEYS.DOCS,next);
  }
  function deleteDoc(doc){
    if(!confirm("Remove this document?")) return;
    const next=docs.filter(d=>d.id!==doc.id);
    setDocs(next); writeLS(LS_KEYS.DOCS,next);
  }

  const activeTrades = useMemo(()=>{
    if(!cfg) return [];
    return (cfg.tradesNeeded||[]).map(id=>tradeCatalog.find(t=>t.id===id)).filter(Boolean);
  },[cfg]);

  if(!cfg) return <div className="card"><Seed /><div className="hint">Loading…</div></div>;

  return (
    <div>
      <Seed />
      <div className="card">
        <div className="cardHeader">
          <div>
            <h1>Builder Setup</h1>
            <div className="hint">Select trades needed, define bid templates, manage documents. Community code: <b>{cfg.communityCode}</b></div>
          </div>
          <div className="row">
            <a className="btn ghost" href="/builder">Back</a>
            <a className="btn primary" href="/builder/analysis">Bid Analysis →</a>
          </div>
        </div>

        <div className="hr"></div>

        <h2>Trades needed</h2>
        <div className="row" style={{marginTop:10}}>
          {tradeCatalog.map(t=>{
            const on=(cfg.tradesNeeded||[]).includes(t.id);
            return <button key={t.id} className={"btn "+(on?"good":"ghost")} onClick={()=>toggleTrade(t.id)}>{on?"✓ ":""}{t.name}</button>;
          })}
        </div>

        <div className="hr"></div>

        <h2>Bid templates</h2>
        <div className="tablewrap" style={{marginTop:10}}>
          <table>
            <thead><tr><th>Trade</th><th>Format</th><th>Configure</th></tr></thead>
            <tbody>
              {activeTrades.map(t=>{
                const tpl=tpls[t.id]||{mode:"lumpsum",items:[]};
                return (
                  <tr key={t.id}>
                    <td><b>{t.name}</b></td>
                    <td>
                      <div className="row">
                        <button className={"btn "+(tpl.mode==="lumpsum"?"primary":"ghost")} onClick={()=>setMode(t.id,"lumpsum")}>Lumpsum</button>
                        <button className={"btn "+(tpl.mode==="lineitems"?"primary":"ghost")} onClick={()=>setMode(t.id,"lineitems")}>Line items</button>
                      </div>
                    </td>
                    <td><button className="btn" onClick={()=>setOpenTrade(t.id)}>Edit template</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="hr"></div>

        <div className="cardHeader">
          <div><h2>Documents</h2><div className="hint">Builder can add/edit/remove. Vendors can view once registered.</div></div>
          <button className="btn good" onClick={addDoc}>Add document</button>
        </div>
        <div className="tablewrap" style={{marginTop:10}}>
          <table>
            <thead><tr><th>Title</th><th>URL</th><th>Updated</th><th>Actions</th></tr></thead>
            <tbody>
              {docs.length===0 ? <tr><td colSpan={4} className="small">No documents posted yet.</td></tr> : docs.map(d=>(
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td className="small">{d.url ? <a className="navLink" href={d.url} target="_blank">Open</a> : "—"}</td>
                  <td className="small">{new Date(d.updatedAt).toLocaleString()}</td>
                  <td><div className="row"><button className="btn" onClick={()=>editDoc(d)}>Edit</button><button className="btn bad" onClick={()=>deleteDoc(d)}>Remove</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!openTrade} title={"Edit Template — "+(tradeCatalog.find(t=>t.id===openTrade)?.name||"")} onClose={()=>setOpenTrade(null)}>
        {openTrade && <TemplateEditor cfg={cfg} tradeId={openTrade} tpl={tpls[openTrade]||{mode:"lumpsum",items:[]}} onSetMode={setMode} onAddItem={addItem} onUpdateItem={updateItem} onRemoveItem={removeItem} />}
      </Modal>
    </div>
  );
}

function TemplateEditor({cfg, tradeId, tpl, onSetMode, onAddItem, onUpdateItem, onRemoveItem}){
  const plans=cfg.plans||[];
  return (
    <div>
      <div className="row" style={{justifyContent:"space-between"}}>
        <div className="hint">This controls what vendors must submit.</div>
        <div className="row">
          <button className={"btn "+(tpl.mode==="lumpsum"?"primary":"ghost")} onClick={()=>onSetMode(tradeId,"lumpsum")}>Lumpsum</button>
          <button className={"btn "+(tpl.mode==="lineitems"?"primary":"ghost")} onClick={()=>onSetMode(tradeId,"lineitems")}>Line items</button>
        </div>
      </div>

      {tpl.mode==="lumpsum" ? (
        <div className="hint" style={{marginTop:12}}>Vendors enter one amount per plan + notes.</div>
      ) : (
        <div style={{marginTop:12}}>
          <div className="cardHeader">
            <div><h2>Line items</h2><div className="hint">Define items + UOM + takeoffs per plan. Vendors enter unit pricing.</div></div>
            <button className="btn good" onClick={()=>onAddItem(tradeId)}>Add item</button>
          </div>
          <div className="tablewrap" style={{marginTop:10}}>
            <table>
              <thead><tr><th>Item</th><th>UOM</th>{plans.map(p=><th key={p.id}>Qty ({p.name})</th>)}<th></th></tr></thead>
              <tbody>
                {(tpl.items||[]).length===0 ? <tr><td colSpan={3+plans.length} className="small">No items yet.</td></tr> : (tpl.items||[]).map(it=>(
                  <tr key={it.id}>
                    <td><input className="input" value={it.name} onChange={e=>onUpdateItem(tradeId,it.id,{name:e.target.value})} placeholder="Item name" /></td>
                    <td><input className="input" style={{minWidth:140}} value={it.uom} onChange={e=>onUpdateItem(tradeId,it.id,{uom:e.target.value})} placeholder="UOM" /></td>
                    {plans.map(p=>(
                      <td key={p.id}>
                        <input className="input" style={{minWidth:120}} value={it.qtyByPlan?.[p.id] ?? 0} onChange={e=>{
                          const v=Number(e.target.value)||0;
                          const qtyByPlan={...(it.qtyByPlan||{}),[p.id]:v};
                          onUpdateItem(tradeId,it.id,{qtyByPlan});
                        }} />
                      </td>
                    ))}
                    <td><button className="btn bad" onClick={()=>onRemoveItem(tradeId,it.id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
