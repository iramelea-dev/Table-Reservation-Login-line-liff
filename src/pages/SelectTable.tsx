import React, { useMemo, useRef, useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonSegment, IonSegmentButton, IonLabel,
  IonItem, IonToggle, IonRange, IonChip, IonModal, IonInput, IonSelect, IonSelectOption,
  IonTextarea, IonFooter,
  IonImg
} from "@ionic/react";
import t1 from "../assets/images/Table4.svg"
import t2 from "../assets/images/Table3.svg"

type Tabletype = "SMALL" | "MEDIUM" | "LARGE"
type Zone = "A" | "B";
type Status = "ว่าง" | "จองแล้ว" | "ไม่ว่าง";
type Adding = { zone: Zone; size: Tabletype } | null;


interface TableNode {
  id: string;      // รหัสโต๊ะ (สุ่ม uid)
  label: string;   // ชื่อ/เบอร์โต๊ะ เช่น A1, B2
  desc?: string;   // คำอธิบายเพิ่มเติม
  zone: Zone;      // โซนที่อยู่ (A หรือ B)
  seats: number;   // จำนวนที่นั่ง
  status: Status;  // สถานะโต๊ะ
  x: number;       // ตำแหน่ง X (0..1 = สัดส่วนใน container)
  y: number;       // ตำแหน่ง Y (0..1)
  size: Tabletype;
}


const uid = () => Math.random().toString(36).slice(2, 9); // >> สุ่มเลขไอดี
const clamp01 = (v: number) => Math.max(0, Math.min(1, v)) // >> ทำให้มันสุ่มอยู่ในช่วง ของ แกน  x,y at [0,1] กันหลุดขอบ

const statusColor: Record<Status, { color: string; bg: string; border: string }> = {
  ว่าง: { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(52,211,153,0.4)" },
  จองแล้ว: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(251,191,36,0.4)" },
  ไม่ว่าง: { color: "#f43f5e", bg: "rgba(244,63,94,0.15)", border: "rgba(251,113,133,0.4)" },
};

const PIC = {
  T1: t1,
  T2: t2
} as const;

type Pickey = keyof typeof PIC;



export const SelectTable = () => {
  const [zonefilter, setZoneFilter] = useState<Zone | "ALL">("ALL");
  const [tables, setTables] = useState<TableNode[]>([]);
  const [available, setAvailable] = useState(false);
  const [adding, setAdding] = useState<Adding | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<TableNode | null>(null);


  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLIonContentElement | null>(null);

  const dragInfo = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const shown = useMemo(() => {
    return tables
      .filter((t) => (zonefilter === "ALL" ? true : t.zone === zonefilter))
      .filter((t) => (available ? t.status === "ว่าง" : true));
  }, [tables, zonefilter, available]);

  const startAdd = (zone: Zone, size: Tabletype) =>
    setAdding({ zone, size });
  function countNextIndex(z: Zone) {
    const inZone = tables.filter((t) => t.zone === z);
    return inZone.length + 1; // นับ เลขโต๊ะ มันเคยซ้ำ
  }
  const key: Pickey = "T1";
  const fee: Pickey = "T2";

  const DEFAULT_SEATS: Record<Tabletype, number> = {
    SMALL: 2,
    MEDIUM: 4,
    LARGE: 6,
  };

  function handlePlanClick(e: React.MouseEvent) {
    if (!adding || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const label = `${adding.zone}${countNextIndex(adding.zone)}`;

    const node: TableNode = {

      id: uid(), label,
      desc: "",
      zone: adding.zone,
      size: adding.size,
      seats: DEFAULT_SEATS[adding.size],
      status: "ว่าง",
      x: clamp01(x),
      y: clamp01(y),
    };
    setTables((prev) => [...prev, node]);
    setSelected(node);
    setAdding(null);
  }

  function onPointerDownNode(e: React.PointerEvent, t: TableNode) {
    if (!containerRef.current) return;

    // จับ pointer เพื่อรับ move/up ต่อเนื่อง (สำคัญบน mobile)
    // (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

    const rect = containerRef.current.getBoundingClientRect();
    const nodeX = t.x * rect.width;
    const nodeY = t.y * rect.height;

    dragInfo.current = {
      id: t.id,
      offsetX: e.clientX - (rect.left + nodeX),
      offsetY: e.clientY - (rect.top + nodeY),
    };

    setDragging(true);
    // กัน IonContent scroll ระหว่างลาก
    contentRef.current?.scrollToPoint?.(0, 0, 0);
    e.preventDefault();
    e.stopPropagation();
  }

  function onPointerUpPlan(e: React.PointerEvent) {
    dragInfo.current = null;
    setDragging(false);
    e.preventDefault();
  }

  function onPointerMovePlan(e: React.PointerEvent) {
    if (!dragInfo.current || !containerRef.current) return;
    const { id, offsetX, offsetY } = dragInfo.current;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left - offsetX) / rect.width);
    const y = clamp01((e.clientY - rect.top - offsetY) / rect.height);
    setTables((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    e.preventDefault();
  }

  function updateSelected(partial: Partial<TableNode>) {
    if (!selected) return;
    setTables((prev) => prev.map((n) => (n.id === selected.id ? { ...n, ...partial } : n)));
    setSelected((s) => (s ? { ...s, ...partial } : s));
  }

  function removeSelected() {
    if (!selected) return;
    setTables((prev) => prev.filter((n) => n.id !== selected.id));
    setSelected(null);
  }


  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle> Floor plan - Ionic </IonTitle>
          <IonButton slot="end">
            <IonButton onClick={() => startAdd("A", "SMALL")}>+ Small A</IonButton> 
            <IonButton onClick={() => startAdd("B", "MEDIUM")}>+ Small A</IonButton> 
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent ref={contentRef} fullscreen scrollY={!dragging}>

        <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
          <IonChip color="success">ว่าง</IonChip>
          <IonChip color="warning">จองแล้ว</IonChip>
          <IonChip color="danger">ไม่ว่าง</IonChip>
        </div>
        <div style={{ display: "grid", gap: 8, padding: "0 16px 12px 16px" }}>
          <IonSegment
            value={zonefilter}
            onIonChange={(e) => setZoneFilter((e.detail.value as any) ?? "ALL")}
          >
            <IonSegmentButton value={"ALL"}>
              <IonLabel>All Zone</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value={"A"}>
              <IonLabel>Zone A</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value={"B"}>
              <IonLabel>Zone B</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {/*<< this Toggle  >>*/}
          {/* <IonItem lines="none" color={"light"}>
                    <IonLabel>Available</IonLabel>
                    <IonToggle color={"secondary"} 
                        checked={available}
                        onIonChange={(e) =>
                            setAvailable(e.detail.checked)
                        } />
                </IonItem> */}
          {/* <IonItem lines="none"> 
                    <IonLabel>Zoom: {zoom.toFixed(2)}x</IonLabel>
                    <IonRange
                    min={1}
                    max={2}
                    step={0.1} 
                    value={zoom}
                    onIonInput={(e) => setZoom(Number(e.detail.value))}
                    />
                    
                </IonItem> */}
        </div>
        <div
          ref={containerRef}
          onPointerMove={onPointerMovePlan}
          onPointerUp={onPointerUpPlan}
          onPointerCancel={onPointerUpPlan}
          onClick={handlePlanClick}
          style={{
            position: "relative",
            width: "93%",
            height: 520,
            borderRadius: 16,
            border: "1px solid rgba(241, 19, 19, 0.08)",
            backgroundColor: "#0f172a",
            overflow: "hidden",
            margin: "0 16px",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px, 32px 32px",
            // Mobile
            touchAction: "none",
            userSelect: "none",
          }}
        >

          <div
            style={{
              // transform: `scale(1)`,
              transformOrigin: "top left",
              width: `calc(100% )`,
              height: `calc(100% )`,
              position: "relative",
            }}
          >
            {shown.map((t) => {
              const colors = statusColor[t.status];
              return (
                <div
                  key={t.id}
                  role="button"
                  // node
                  onPointerDown={(e) => onPointerDownNode(e, t)}
                  onClick={(e) => {

                    e.stopPropagation();
                    setSelected(t);
                  }}
                  title={t.label}
                  style={{
                    position: "absolute",
                    left: `${t.x * 100}%`,
                    top: `${t.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                    borderRadius: 16,
                    border: `1px solid ${colors.border}`,
                    padding: "8px 12px",
                    background: colors.bg,
                    color: "#e2e8f0",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                    textAlign: "left",
                    width: 120,
                    // กันเลือกตัวอักษร/gesture แปลก ๆ ตอนลาก
                    touchAction: "none",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative", fontWeight: 700, color: "#fff" }}>
                    <IonLabel style={{ position: "absolute" }}> {t.label} </IonLabel>

                    <IonImg src={PIC[key]} style={{ width: 180, height: "auto" }} />

                  </div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                    Zone {t.zone} · {t.seats} seats
                  </div>
                  {t.desc && (
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, maxWidth: 160 }}>
                      {t.desc}
                    </div>
                  )}
                </div>
              );
            })}

            {adding && (
              <div
                style={{
                  position: "absolute",
                  left: 8,
                  top: 8,
                  background: "#22d3ee",
                  color: "#0b4eeaff",
                  borderRadius: 12,
                  padding: "6px 10px",
                  fontWeight: 600,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                }}
              >
                Tap on the plan to add a table in Zone 
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: "8px 16px", fontSize: 12, opacity: 0.8 }}>
          กด บวกก่อนแล้ว แตะที่บริเวณ เพื่อเพิ่มโต๊ะ
        </div>

        {/* Editor Modal */}
        <IonModal isOpen={!!selected} onDidDismiss={() => setSelected(null)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{selected ? `แก้ไข โต๊ะ : ${selected.label}` : "Edit Table"}</IonTitle>
              <IonButton slot="end">
                <IonButton onClick={() => setSelected(null)}>Close</IonButton>
              </IonButton>
            </IonToolbar>
          </IonHeader>

          <IonContent>
            {selected && (
              <div style={{ padding: 16, display: "grid", gap: 12 }}>
                <IonItem>
                  <IonLabel position="stacked">Label</IonLabel>
                  <IonInput
                    value={selected.label}
                    onIonChange={(e) => updateSelected({ label: String(e.detail.value || "") })}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Seats</IonLabel>
                  <IonInput
                    type="number"
                    min="1"
                    inputmode="numeric"
                    value={selected.seats}
                    onIonChange={(e) =>
                      updateSelected({
                        seats: Math.max(1, parseInt(String(e.detail.value ?? "1"), 10)),
                      })
                    }
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Zone</IonLabel>
                  <IonSelect
                    value={selected.zone}
                    onIonChange={(e) => updateSelected({ zone: e.detail.value as Zone })}
                  >
                    <IonSelectOption value="A">A</IonSelectOption>
                    <IonSelectOption value="B">B</IonSelectOption>
                  </IonSelect>
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Status</IonLabel>
                  <IonSelect
                    value={selected.status}
                    onIonChange={(e) => updateSelected({ status: e.detail.value as Status })}
                  >
                    <IonSelectOption value="ว่าง">ว่าง</IonSelectOption>
                    <IonSelectOption value="จองแล้ว">จองแล้ว</IonSelectOption>
                    <IonSelectOption value="ไม่ว่าง">ไม่ว่าง</IonSelectOption>
                  </IonSelect>
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Description</IonLabel>
                  <IonTextarea
                    autoGrow
                    value={selected.desc ?? ""}
                    onIonChange={(e) => updateSelected({ desc: e.detail.value ?? "" })}
                    placeholder="ขอบรรไดหน่อย"
                  />
                </IonItem>
                {/* <div style={{ fontSize: 12, opacity: 0.8 }}>
                  ตำแหน่ง: x {(selected.x * 100).toFixed(1)}% · y {(selected.y * 100).toFixed(1)}%
                </div> */}

                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <IonButton color="danger" onClick={removeSelected}>
                    Delete
                  </IonButton>
                  <IonButton onClick={() => setSelected(null)} color="success">
                    Done
                  </IonButton>
                </div>
              </div>
            )}
          </IonContent>

          <IonFooter>
            <IonToolbar />
          </IonFooter>
        </IonModal>
      </IonContent>
    </IonPage >
  );
}

export default SelectTable;
