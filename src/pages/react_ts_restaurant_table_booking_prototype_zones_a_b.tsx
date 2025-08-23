import React, { useEffect, useMemo, useRef, useState } from "react";


type Zone = "A" | "B";
type Status = "AVAILABLE" | "RESERVED" | "OCCUPIED";

interface TableNode {
  id: string;
  label: string;       // ชื่อโต๊ะ (เช่น A1)
  desc?: string;       // คำอธิบาย
  zone: Zone;          // A/B
  seats: number;       // จำนวนที่นั่ง
  status: Status;      // สถานะ
  x: number;           // 0..1 (สัดส่วนภายในพื้นที่)
  y: number;           // 0..1
}

// ---------- Helpers ----------
const statusChip = (s: Status) => {
  const map: Record<Status, string> = {
    AVAILABLE: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    RESERVED: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    OCCUPIED: "bg-rose-500/20 text-rose-300 border-rose-400/30",
  };
  return `inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${map[s]}`;
};

const uid = () => Math.random().toString(36).slice(2, 9);

// ---------- Component ----------
export default function FloorPlanEditor() {
  const [zoneFilter, setZoneFilter] = useState<Zone | "ALL">("ALL");
  const [tables, setTables] = useState<TableNode[]>([]); // เริ่มว่างเปล่า
  const [adding, setAdding] = useState<Zone | null>(null); // โหมดเพิ่มโต๊ะด้วยการคลิกบนผัง
  const [selected, setSelected] = useState<TableNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // ลากโต๊ะ
  const dragInfo = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ตารางที่จะแสดงตามฟิลเตอร์
  const shown = useMemo(() => {
    return tables.filter(t => (zoneFilter === "ALL" ? true : t.zone === zoneFilter))
                 .filter(t => (onlyAvailable ? t.status === "AVAILABLE" : true));
  }, [tables, zoneFilter, onlyAvailable]);

  // วางโต๊ะใหม่ด้วยคลิกบนพื้นที่
  function handlePlanClick(e: React.MouseEvent) {
    if (!adding || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const node: TableNode = {
      id: uid(),
      label: `${adding}${countNextIndex(adding)}`,
      desc: "",
      zone: adding,
      seats: 2,
      status: "AVAILABLE",
      x: clamp01(x),
      y: clamp01(y),
    };
    setTables(prev => [...prev, node]);
    setSelected(node);
    setAdding(null);
  }

  function countNextIndex(z: Zone) {
    const inZone = tables.filter(t => t.zone === z);
    // หาเลขถัดไปแบบง่าย ๆ
    const next = inZone.length + 1;
    return next;
  }

  function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

  // ลากโต๊ะ (drag)
  function onMouseDownNode(e: React.MouseEvent, t: TableNode) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nodeX = t.x * rect.width;
    const nodeY = t.y * rect.height;
    dragInfo.current = { id: t.id, offsetX: e.clientX - (rect.left + nodeX), offsetY: e.clientY - (rect.top + nodeY) };
  }

  function onMouseMovePlan(e: React.MouseEvent) {
    if (!dragInfo.current || !containerRef.current) return;
    const { id, offsetX, offsetY } = dragInfo.current;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left - offsetX) / rect.width);
    const y = clamp01((e.clientY - rect.top - offsetY) / rect.height);
    setTables(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  }

  function onMouseUpPlan() { dragInfo.current = null; }

  // CRUD helpers
  function updateSelected(partial: Partial<TableNode>) {
    if (!selected) return;
    setTables(prev => prev.map(n => n.id === selected.id ? { ...n, ...partial } : n));
    setSelected(s => s ? { ...s, ...partial } : s);
  }
  function removeSelected() {
    if (!selected) return;
    setTables(prev => prev.filter(n => n.id !== selected.id));
    setSelected(null);
  }

  // โทน UI
  return (
    <div className="min-h-[80vh] w-full bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Floor Plan – Add Your Own Tables</h1>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className={statusChip("AVAILABLE")}>Available</span>
            <span className={statusChip("RESERVED")}>Reserved</span>
            <span className={statusChip("OCCUPIED")}>Occupied</span>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex p-1 rounded-2xl bg-slate-800 border border-white/10">
            {(["ALL", "A", "B"] as const).map(z => (
              <button key={z}
                onClick={() => setZoneFilter(z)}
                className={`px-4 py-2 rounded-xl transition ${zoneFilter === z ? "bg-cyan-500 text-slate-900" : "text-slate-200 hover:bg-slate-700"}`}
              >{z === "ALL" ? "All Zones" : `Zone ${z}`}</button>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 text-sm bg-slate-800 border border-white/10 rounded-xl px-3 py-2 cursor-pointer select-none">
            <input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)} />
            <span>Only available</span>
          </label>

          <div className="inline-flex items-center gap-2 bg-slate-800 border border-white/10 rounded-xl px-3 py-2">
            <span className="text-sm">Zoom</span>
            <input type="range" min={0.6} max={1.6} step={0.05} value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} />
            <span className="tabular-nums text-sm w-10 text-right">{zoom.toFixed(2)}x</span>
          </div>

          <div className="inline-flex gap-2">
            <button onClick={() => setAdding("A")} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-900 px-3 py-2 font-medium">+ Add Table (Zone A)</button>
            <button onClick={() => setAdding("B")} className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 py-2 font-medium">+ Add Table (Zone B)</button>
          </div>
        </div>

        {/* Canvas / Plan */}
        <div
          ref={containerRef}
          onClick={handlePlanClick}
          onMouseMove={onMouseMovePlan}
          onMouseUp={onMouseUpPlan}
          className="relative w-full h-[520px] rounded-2xl border border-white/10 bg-slate-900 overflow-hidden"
          style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`, backgroundSize: `32px 32px, 32px 32px` }}
        >
          <div className="origin-top-left" style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `calc(100% / ${zoom})`, height: `calc(100% / ${zoom})` }}>
            {shown.map(t => (
              <button key={t.id}
                onMouseDown={(e)=>onMouseDownNode(e,t)}
                onClick={(e)=>{ e.stopPropagation(); setSelected(t); }}
                className={`absolute group -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-3 py-2 text-left shadow ${
                  t.status === "AVAILABLE" ? "bg-emerald-500/15 border-emerald-400/40 hover:border-emerald-300/80" :
                  t.status === "RESERVED" ? "bg-amber-500/15 border-amber-400/40 hover:border-amber-300/80" :
                  "bg-rose-500/15 border-rose-400/40 hover:border-rose-300/80"}
                `}
                style={{ left: `${t.x*100}%`, top: `${t.y*100}%` }}
                title={t.label}
              >
                <div className="font-semibold">{t.label}</div>
                <div className="text-xs text-slate-300">Zone {t.zone} · {t.seats} seats</div>
                {t.desc && <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 max-w-[160px]">{t.desc}</div>}
              </button>
            ))}

            {/* โหมดกำลังเพิ่มโต๊ะ */}
            {adding && (
              <div className="absolute left-2 top-2 rounded-xl bg-cyan-500 text-slate-900 px-3 py-1 text-sm font-medium shadow">
                Click on the plan to add a table in Zone {adding}
              </div>
            )}
          </div>
        </div>

        {/* Side + Legend */}
        <div className="text-xs text-slate-400">Tip: คลิก "+ Add Table" แล้วคลิกบนแผนผังเพื่อวางตำแหน่งโต๊ะ · ลากโต๊ะเพื่อย้ายตำแหน่ง · คลิกโต๊ะเพื่อแก้ไขรายละเอียด</div>

        {/* Focus / Editor */}
        {selected && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setSelected(null)}>
            <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-slate-900/90 p-5 shadow-2xl" onClick={(e)=>e.stopPropagation()}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold">Edit Table – {selected.label}</h3>
                <button onClick={()=>setSelected(null)} className="rounded-lg px-2 py-1 text-slate-300 hover:bg-slate-700">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">Label
                  <input className="w-full mt-1 rounded-xl bg-white/10 border border-white/20 px-3 py-2 outline-none"
                    value={selected.label}
                    onChange={e=>updateSelected({ label: e.target.value })}/>
                </label>
                <label className="text-sm">Seats
                  <input type="number" min={1} className="w-full mt-1 rounded-xl bg-white/10 border border-white/20 px-3 py-2 outline-none"
                    value={selected.seats}
                    onChange={e=>updateSelected({ seats: Math.max(1, parseInt(e.target.value||"1",10)) })}/>
                </label>

                <label className="text-sm">Zone
                  <select className="w-full mt-1 rounded-xl bg-white/10 border border-white/20 px-3 py-2 outline-none"
                    value={selected.zone}
                    onChange={e=>updateSelected({ zone: e.target.value as Zone })}>
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </label>
                <label className="text-sm">Status
                  <select className="w-full mt-1 rounded-xl bg-white/10 border border-white/20 px-3 py-2 outline-none"
                    value={selected.status}
                    onChange={e=>updateSelected({ status: e.target.value as Status })}>
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="RESERVED">RESERVED</option>
                    <option value="OCCUPIED">OCCUPIED</option>
                  </select>
                </label>

                <label className="text-sm col-span-2">Description
                  <textarea className="w-full mt-1 rounded-xl bg-white/10 border border-white/20 px-3 py-2 outline-none min-h-[80px]"
                    placeholder="หมายเหตุ/คำอธิบาย เช่น โต๊ะริมน้ำ, ใกล้ปลั๊ก, สำหรับเด็ก"
                    value={selected.desc || ""}
                    onChange={e=>updateSelected({ desc: e.target.value })}></textarea>
                </label>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-slate-400">ตำแหน่ง: x {(selected.x*100).toFixed(1)}% · y {(selected.y*100).toFixed(1)}%</div>
                <div className="flex gap-2">
                  <button onClick={removeSelected} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 font-medium">Delete</button>
                  <button onClick={()=>setSelected(null)} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-900 px-3 py-2 font-medium">Done</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
