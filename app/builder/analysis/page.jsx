"use client";
import Seed from "../../components/Seed";
import demo from "../../../data/demo.json";
import Modal from "../../components/Modal";
import ChatPanel from "../../components/ChatPanel";
import { LS_KEYS, readLS, writeLS, money, sumObjValues } from "../../components/storage";
import { useEffect, useMemo, useState } from "react";

function totalsByPlanForBid(bid, cfg, tpl){
  const mode = bid.format?.mode || tpl?.mode || "lumpsum";
  const out = {}; cfg.plans.forEach(p=>out[p.id]=0);
  if(mode==="lumpsum"){
    for(const p of cfg.plans) out[p.id]=Number(bid.lumpsumByPlan?.[p.id])||0;
    return out;
  }
  for(const p of cfg.plans){
    let tot=0;
    for(const li of (bid.lineItems||[])){
      const unit=Number(li.unitPrice)||0;
      const it=(tpl?.items||[]).find(x=>x.id===li.itemId);
      const q=Number(it?.qtyByPlan?.[p.id])||0;
      tot += unit*q;
    }
    out[p.id]=tot;
  }
  return out;
}
function avgPerPlan(planTotals, nPlans){
  const sum = sumObjValues(planTotals||{});
  return nPlans ? sum/nPlans : 0;
}
function computeLowVendorAvg(tradeId, bids, cfg, tpls){
  const tradeBids=bids.filter(b=>b.tradeId===tradeId && b.status==="submitted");
  const nPlans=cfg.plans.length;
  let best=null;
  for(const b of tradeBids){
    const tpl = tpls[tradeId] || {mode:"lumpsum",items:[]};
    const planTotals = totalsByPlanForBid(b,cfg,tpl);
    const avg = avgPerPlan(planTotals,nPlans);
    if(!best || avg<best.avg) best={vendorId:b.vendorId,vendorName:b.vendorName,avg};
  }
  return best;
}
export default function Analysis(){
  const [cfg,setCfg]=useState(null);
  const [tpls,setTpls]=useState({});
  const [bids,setBids]=useState([]);
  const [selections,setSelections]=useState({});
  const [search,setSearch]=useState("");
  const [onlyVariance,setOnlyVariance]=useState(false);
  const [notesBid,setNotesBid]=useState(null);
  const [chatCtx,setChatCtx]=useState(null);

  useEffect(()=>{
    setCfg(readLS(LS_KEYS.COMMUNITY_CONFIG,null));
    setTpls(readLS(LS_KEYS.TEMPLATES,{}));
    setBids(readLS(LS_KEYS.BIDS,[]));
    setSelections(readLS(LS_KEYS.SELECTIONS,{}));
  },[]);

  if(!cfg) return <div className="card"><Seed /><div className="hint">Loading…</div></div>;

  const tradeCatalog=demo.tradeCatalog;
  const tradesNeeded=cfg.tradesNeeded||[];

  const computed = useMemo(()=>{
    const submitted=bids.filter(b=>b.status==="submitted" && b.communityId===cfg.communityId);
    const lowByTrade={};
    for(const tid of tradesNeeded) lowByTrade[tid]=computeLowVendorAvg(tid,submitted,cfg,tpls);

    const sel={...selections};
    let changed=false;
    for(const tid of tradesNeeded){
      if(!sel[tid] && lowByTrade[tid]?.vendorId){ sel[tid]=lowByTrade[tid].vendorId; changed=true; }
    }
    if(changed) writeLS(LS_KEYS.SELECTIONS, sel);

    const selectedTotals={}, lowTotals={};
    cfg.plans.forEach(p=>{selectedTotals[p.id]=0; lowTotals[p.id]=0;});
    for(const tid of tradesNeeded){
      const tradeBids=submitted.filter(b=>b.tradeId===tid);
      const lowId=lowByTrade[tid]?.vendorId;
      const selId=sel[tid];
      const lowBid=tradeBids.find(b=>b.vendorId===lowId);
      const selBid=tradeBids.find(b=>b.vendorId===selId);
      const tpl=tpls[tid]||{mode:"lumpsum",items:[]};
      const lowPT=lowBid?totalsByPlanForBid(lowBid,cfg,tpl):null;
      const selPT=selBid?totalsByPlanForBid(selBid,cfg,tpl):null;
      for(const p of cfg.plans){
        lowTotals[p.id]+=Number(lowPT?.[p.id])||0;
        selectedTotals[p.id]+=Number(selPT?.[p.id])||0;
      }
    }
    return {submitted, lowByTrade, selectedTotals, lowTotals, sel};
  },[bids,selections,cfg,tpls,tradesNeeded]);

  function saveSelections(next){ setSelections(next); writeLS(LS_KEYS.SELECTIONS,next); }

  function showTrade(tid){
    const tname=tradeCatalog.find(t=>t.id===tid)?.name||tid;
    if(search){
      const q=search.toLowerCase();
      const tradeMatch=tname.toLowerCase().includes(q);
      const vendorMatch=computed.submitted.some(b=>b.tradeId===tid && b.vendorName.toLowerCase().includes(q));
      if(!tradeMatch && !vendorMatch) return false;
    }
    if(onlyVariance){
      const lowId=computed.lowByTrade[tid]?.vendorId;
      const selId=computed.sel[tid];
      if(!lowId || !selId) return false;
      if(lowId===selId) return false;
    }
    return true;
  }

  const totalsRow=(label,obj,perSf=false)=>(
    <tr>
      <td><b>{label}</b></td>
      {cfg.plans.map(p=>{
        const v=obj[p.id]||0;
        const out=perSf?money(v/(Number(p.sqft)||1)):money(v);
        return <td key={p.id}><b>{out}</b></td>;
      })}
    </tr>
  );

  return (
    <div>
      <Seed />
      <div className="card">
        <div className="cardHeader">
          <div>
            <h1>Bid Analysis</h1>
            <div className="hint">Low = <b>(Sum of all plans ÷ # of plans)</b> = Avg/Plan • Community: <b>{cfg.communityName}</b></div>
          </div>
          <div className="row">
            <a className="btn ghost" href="/builder">Back</a>
            <a className="btn" href="/builder/setup">Setup</a>
          </div>
        </div>
        <div className="hr"></div>
        <h2>Totals</h2>
        <div className="tablewrap" style={{marginTop:10}}>
          <table>
            <thead><tr><th>Metric</th>{cfg.plans.map(p=><th key={p.id}>{p.name}</th>)}</tr></thead>
            <tbody>
              {totalsRow("Direct costs with Selected vendors", computed.selectedTotals)}
              {totalsRow("Selected $/SF", computed.selectedTotals, true)}
              {totalsRow("Direct costs with Lowest vendors", computed.lowTotals)}
              {totalsRow("Lowest $/SF", computed.lowTotals, true)}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <div><h2>Trade analysis</h2><div className="hint">Select a vendor per trade, view vendor notes, and chat privately.</div></div>
          <div className="row">
            <input className="input" style={{minWidth:240}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search trade or vendor…" />
            <label className="row" style={{gap:8,color:"var(--muted)",fontSize:12}}>
              <input type="checkbox" checked={onlyVariance} onChange={e=>setOnlyVariance(e.target.checked)} />
              Show only trades where selected ≠ low
            </label>
          </div>
        </div>

        <div className="tablewrap" style={{marginTop:12}}>
          <table>
            <thead>
              <tr>
                <th>Low</th><th>Selected</th><th>Trade / Vendor</th>
                {cfg.plans.map(p=><th key={p.id}>{p.name}</th>)}
                <th>Sum</th><th>Avg/Plan</th><th>Delta vs Low (Avg)</th><th>Notes</th><th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {tradesNeeded.filter(showTrade).map(tid=>{
                const tname=tradeCatalog.find(t=>t.id===tid)?.name||tid;
                const tpl=tpls[tid]||{mode:"lumpsum",items:[]};
                const tradeBids=computed.submitted.filter(b=>b.tradeId===tid);
                const lowId=computed.lowByTrade[tid]?.vendorId;
                const lowBid=tradeBids.find(b=>b.vendorId===lowId);
                const lowPT=lowBid?totalsByPlanForBid(lowBid,cfg,tpl):null;
                const lowSum=sumObjValues(lowPT||{});
                const lowAvg=cfg.plans.length?lowSum/cfg.plans.length:0;

                return (
                  <>
                    <tr className="group" key={tid+"-g"}>
                      <td colSpan={6+cfg.plans.length}>{tname} <span className="small">— format: <b>{tpl.mode}</b></span></td>
                      <td colSpan={3}></td>
                    </tr>
                    {tradeBids.length===0 ? (
                      <tr key={tid+"-none"}>
                        <td></td><td></td><td className="small">No bids submitted yet for this trade.</td>
                        {cfg.plans.map(p=><td key={p.id}></td>)}
                        <td></td><td></td><td></td><td></td><td></td>
                      </tr>
                    ) : tradeBids.map(b=>{
                      const isLow=b.vendorId===lowId;
                      const isSel=computed.sel[tid]===b.vendorId;
                      const planTotals=totalsByPlanForBid(b,cfg,tpl);
                      const sum=sumObjValues(planTotals);
                      const avg=cfg.plans.length?sum/cfg.plans.length:0;
                      const delta=avg-lowAvg;

                      return (
                        <tr key={b.bidId}>
                          <td className={isLow?"low":""}>{isLow?"x":""}</td>
                          <td>
                            <label className="row" style={{gap:8}}>
                              <input type="radio" name={"sel-"+tid} checked={isSel} onChange={()=>saveSelections({...computed.sel,[tid]:b.vendorId})} />
                              <span className={isSel?"sel":""}>{isSel?"x":""}</span>
                            </label>
                          </td>
                          <td><div><b>{b.vendorName}</b></div><div className="small">Submitted {new Date(b.submittedAt).toLocaleString()}</div></td>
                          {cfg.plans.map(p=><td key={p.id}>{money(planTotals[p.id])}</td>)}
                          <td><b>{money(sum)}</b></td>
                          <td><b>{money(avg)}</b></td>
                          <td>{delta===0?<span className="small">—</span>:delta>0?<span className="warn">+{money(delta)}</span>:<span className="low">{money(delta)}</span>}</td>
                          <td><button className="btn" onClick={()=>setNotesBid({tradeId:tid,tradeName:tname,bid:b})}>View</button></td>
                          <td><button className="btn good" onClick={()=>setChatCtx({vendorId:b.vendorId,vendorName:b.vendorName,tradeId:tid,tradeName:tname})}>Chat</button></td>
                        </tr>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!notesBid} title={notesBid?`Vendor Notes — ${notesBid.bid.vendorName} (${notesBid.tradeName})`:"Vendor Notes"} onClose={()=>setNotesBid(null)}>
        {notesBid && (
          <div>
            <div className="hint"><b>Bid format:</b> {notesBid.bid.format?.mode || (tpls[notesBid.tradeId]?.mode || "lumpsum")}</div>
            <div className="hr"></div>
            <div style={{whiteSpace:"pre-wrap"}}>{notesBid.bid.notes || "No notes provided."}</div>
          </div>
        )}
      </Modal>

      <Modal open={!!chatCtx} title={chatCtx?`Feedback Chat — ${chatCtx.vendorName} (${chatCtx.tradeName})`:"Feedback Chat"} onClose={()=>setChatCtx(null)}>
        {chatCtx && (
          <ChatPanel communityId={cfg.communityId} vendorId={chatCtx.vendorId} vendorName={chatCtx.vendorName} tradeId={chatCtx.tradeId} tradeName={chatCtx.tradeName} currentUserRole="builder" />
        )}
      </Modal>
    </div>
  );
}