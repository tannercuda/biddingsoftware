"use client";
export default function Modal({open,title,children,onClose}){
  if(!open) return null;
  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div className="card modal" onMouseDown={(e)=>e.stopPropagation()}>
        <div className="cardHeader">
          <div>
            <h2>{title}</h2>
            <div className="hint">Click outside to close.</div>
          </div>
          <button className="btn ghost" onClick={onClose}>Close</button>
        </div>
        <div className="hr"></div>
        {children}
      </div>
    </div>
  );
}