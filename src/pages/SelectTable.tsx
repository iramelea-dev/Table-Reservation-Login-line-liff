import React, { useMemo, useRef, useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonSegment, IonSegmentButton, IonLabel,
  IonItem, IonToggle, IonRange, IonChip, IonModal, IonInput, IonSelect, IonSelectOption,
  IonTextarea, IonFooter
} from "@ionic/react";

type Zone = "A" | "B";
type Status = "AVAILABLE" | "RESERVED" | "OCCUPIED";

interface TableNode {
  id: string;
  label: string;
  desc?: string;
  zone: Zone;
  seats: number;
  status: Status;
  x: number; // 0..1
  y: number; // 0..1
}

// ---------- helpers ----------
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const statusColor: Record<Status, { color: string; bg: string; border: string }> = {
  AVAILABLE: { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(52,211,153,0.4)" },
  RESERVED:  { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(251,191,36,0.4)" },
  OCCUPIED:  { color: "#f43f5e", bg: "rgba(244,63,94,0.15)", border: "rgba(251,113,133,0.4)" },
};

export const SelectTable = () => {
  const [zoneFilter, setZoneFilter] = useState<Zone | "ALL">("ALL");
  const [tables, setTables] = useState<TableNode[]>([]);
  const [adding, setAdding] = useState<Zone | null>(null);
  const [selected, setSelected] = useState<TableNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLIonContentElement | null>(null);

  // drag state (pointer events)
  const dragInfo = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const shown = useMemo(() => {
    return tables
      .filter((t) => (zoneFilter === "ALL" ? true : t.zone === zoneFilter))
      .filter((t) => (onlyAvailable ? t.status === "AVAILABLE" : true));
  }, [tables, zoneFilter, onlyAvailable]);

  function countNextIndex(z: Zone) {
    const inZone = tables.filter((t) => t.zone === z);
    return inZone.length + 1;
  }

  // เพิ่มโต๊ะด้วยการแตะพื้นที่ (ขณะโหมด adding)
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
    setTables((prev) => [...prev, node]);
    setSelected(node);
    setAdding(null);
  }

  // ---- Pointer-based drag handlers ----
  function onPointerDownNode(e: React.PointerEvent, t: TableNode) {
    if (!containerRef.current) return;

    // จับ pointer เพื่อรับ move/up ต่อเนื่อง (สำคัญบน mobile)
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

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

  function onPointerMovePlan(e: React.PointerEvent) {
    if (!dragInfo.current || !containerRef.current) return;
    const { id, offsetX, offsetY } = dragInfo.current;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left - offsetX) / rect.width);
    const y = clamp01((e.clientY - rect.top - offsetY) / rect.height);
    setTables((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    e.preventDefault(); // กัน scroll/gesture
  }

  function onPointerUpPlan(e: React.PointerEvent) {
    dragInfo.current = null;
    setDragging(false);
    e.preventDefault();
  }

  // CRUD helpers
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
          <IonTitle>Floor Plan – Ionic</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setAdding("A")}>+ Table A</IonButton>
            <IonButton onClick={() => setAdding("B")}>+ Table B</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* scrollY จะปิดชั่วคราวตอนลาก เพื่อไม่ให้แย่ง gesture */}
      <IonContent ref={contentRef} fullscreen scrollY={!dragging}>
        {/* Legend */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
          <IonChip color="success">Available</IonChip>
          <IonChip color="warning">Reserved</IonChip>
          <IonChip color="danger">Occupied</IonChip>
        </div>

        {/* Toolbar */}
        <div style={{ display: "grid", gap: 8, padding: "0 16px 12px 16px" }}>
          <IonSegment
            value={zoneFilter}
            onIonChange={(e) => setZoneFilter((e.detail.value as any) ?? "ALL")}
          >
            <IonSegmentButton value={"ALL"}>
              <IonLabel>All Zones</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value={"A"}>
              <IonLabel>Zone A</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value={"B"}>
              <IonLabel>Zone B</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          <IonItem lines="none">
            <IonLabel>Only available</IonLabel>
            <IonToggle
              checked={onlyAvailable}
              onIonChange={(e) => setOnlyAvailable(e.detail.checked)}
            />
          </IonItem>

          <IonItem lines="none">
            <IonLabel>Zoom: {zoom.toFixed(2)}x</IonLabel>
            <IonRange
              min={0.6}
              max={1.6}
              step={0.05}
              value={zoom}
              onIonChange={(e) => setZoom(Number(e.detail.value))}
            />
          </IonItem>
        </div>

        {/* Canvas / Plan */}
        <div
          ref={containerRef}
          // pointer listeners บนผัง
          onPointerMove={onPointerMovePlan}
          onPointerUp={onPointerUpPlan}
          onPointerCancel={onPointerUpPlan}
          onClick={handlePlanClick} // ใช้แตะเพื่อเพิ่มโต๊ะตอนโหมด adding
          style={{
            position: "relative",
            width: "100%",
            height: 520,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "#0f172a",
            overflow: "hidden",
            margin: "0 16px",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px, 32px 32px",
            // สำคัญมากบน mobile: ไม่งั้นจะตีความเป็น scroll/pinch
            touchAction: "none",
            userSelect: "none",
          }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              width: `calc(100% / ${zoom})`,
              height: `calc(100% / ${zoom})`,
              position: "relative",
            }}
          >
            {shown.map((t) => {
              const colors = statusColor[t.status];
              return (
                <div
                  key={t.id}
                  role="button"
                  // เริ่มลากจาก node
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
                    minWidth: 90,
                    // กันเลือกตัวอักษร/gesture แปลก ๆ ตอนลาก
                    touchAction: "none",
                    userSelect: "none",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#fff" }}>{t.label}</div>
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
                  color: "#0f172a",
                  borderRadius: 12,
                  padding: "6px 10px",
                  fontWeight: 600,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                }}
              >
                Tap on the plan to add a table in Zone {adding}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "8px 16px", fontSize: 12, opacity: 0.8 }}>
          Tip: กด “+ Table A/B” แล้วแตะบนผังเพื่อวางตำแหน่ง · ลากโต๊ะด้วยนิ้วเพื่อลองย้ายตำแหน่ง · แตะโต๊ะเพื่อแก้ไขรายละเอียด
        </div>

        {/* Editor Modal */}
        <IonModal isOpen={!!selected} onDidDismiss={() => setSelected(null)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{selected ? `Edit Table – ${selected.label}` : "Edit Table"}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setSelected(null)}>Close</IonButton>
              </IonButtons>
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

                {/* <IonItem>
                  <IonLabel position="stacked">Zone</IonLabel>
                  <IonSelect
                    value={selected.zone}
                    onIonChange={(e) => updateSelected({ zone: e.detail.value as Zone })}
                  >
                    <IonSelectOption value="A">A</IonSelectOption>
                    <IonSelectOption value="B">B</IonSelectOption>
                  </IonSelect>
                </IonItem>        */}

                {/* <IonItem>
                  <IonLabel position="stacked">Status</IonLabel>
                  <IonSelect
                    value={selected.status}
                    onIonChange={(e) => updateSelected({ status: e.detail.value as Status })}
                  >
                    <IonSelectOption value="AVAILABLE">AVAILABLE</IonSelectOption>
                    <IonSelectOption value="RESERVED">RESERVED</IonSelectOption>
                    <IonSelectOption value="OCCUPIED">OCCUPIED</IonSelectOption>
                  </IonSelect>
                </IonItem> */}

                {/* <IonItem>
                  <IonLabel position="stacked">Description</IonLabel>
                  <IonTextarea
                    autoGrow
                    value={selected.desc ?? ""}
                    onIonChange={(e) => updateSelected({ desc: e.detail.value ?? "" })}
                    placeholder="หมายเหตุ/คำอธิบาย เช่น โต๊ะริมน้ำ, ใกล้ปลั๊ก, สำหรับเด็ก"
                  />
                </IonItem> */}

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
    </IonPage>
  );
}

export default SelectTable;