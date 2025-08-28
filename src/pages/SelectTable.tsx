// src/pages/StaffFloorPlan.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonSegment, IonSegmentButton, IonLabel,
  IonChip, IonModal, IonItem, IonInput, IonSelect, IonSelectOption,
  IonTextarea, IonFooter, IonToast
} from "@ionic/react";

type Tabletype = "SMALL" | "MEDIUM" | "LARGE";
type Zone = "A" | "B";
type Status = "ว่าง" | "จองแล้ว" | "ไม่ว่าง";
type Tableshape = "Square" | "Circle";
type ObjectType = "Stage" | "Screen";

type Adding =
  | { kind: "table"; zone: Zone; size: Tabletype }
  | { kind: "object"; objectType: ObjectType }
  | null;

interface TableNode {
  id: string;
  label: string;
  desc?: string;
  zone: Zone;
  seats: number;
  status: Status;
  x: number; // 0..1
  y: number; // 0..1
  size: Tabletype;
  shape: Tableshape;
}

interface ObjectNode {
  id: string;
  label: string;
  type: ObjectType;
  x: number; // 0..1
  y: number; // 0..1
  width: number;  // 0..1
  height: number; // 0..1
  color: string;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const guid = () => (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));

const statusColor: Record<Status, { color: string; bg: string; border: string }> = {
  ว่าง: { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(52,211,153,0.4)" },
  จองแล้ว: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(251,191,36,0.4)" },
  ไม่ว่าง: { color: "#f43f5e", bg: "rgba(244,63,94,0.15)", border: "rgba(251,113,133,0.4)" },
};

const DEFAULT_SEATS: Record<Tabletype, number> = { SMALL: 2, MEDIUM: 4, LARGE: 6 };
const DEFAULT_OBJECT_SIZE: Record<ObjectType, { w: number; h: number; color: string; label: string }> = {
  Stage:  { w: 0.3, h: 0.15, color: "#f59e0b", label: "Stage" },
  Screen: { w: 0.1, h: 0.08, color: "#34d399", label: "Screen" },
};

// seed ข้อมูลเริ่มต้นเล็กน้อยให้เห็นภาพ
const seedTables: TableNode[] = [
  { id: guid(), label: "A1", zone: "A", seats: 4, status: "ว่าง", x: 0.2, y: 0.3, size: "MEDIUM", shape: "Square" },
  { id: guid(), label: "A2", zone: "A", seats: 2, status: "จองแล้ว", x: 0.35, y: 0.3, size: "SMALL", shape: "Square" },
  { id: guid(), label: "B1", zone: "B", seats: 6, status: "ว่าง", x: 0.65, y: 0.65, size: "LARGE", shape: "Square" },
];

const seedObjects: ObjectNode[] = [
  { id: guid(), label: "Stage", type: "Stage", x: 0.5, y: 0.12, width: 0.4, height: 0.12, color: "#f59e0b" },
  { id: guid(), label: "Screen", type: "Screen", x: 0.85, y: 0.18, width: 0.12, height: 0.08, color: "#34d399" },
];

const Selecttable: React.FC = () => {
  const [zonefilter, setZoneFilter] = useState<Zone | "ALL">("ALL");
  const [availableOnly, setAvailableOnly] = useState(false);

  const [tables, setTables] = useState<TableNode[]>(seedTables);
  const [objects, setObjects] = useState<ObjectNode[]>(seedObjects);
  const [selected, setSelected] = useState<TableNode | ObjectNode | null>(null);

  const [adding, setAdding] = useState<Adding>(null);
  const [toastMsg, setToastMsg] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLIonContentElement | null>(null);
  const dragInfo = useRef<{ id: string; type: "table" | "object"; offsetX: number; offsetY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const shownTables = useMemo(
    () => tables
      .filter((t) => (zonefilter === "ALL" ? true : t.zone === zonefilter))
      .filter((t) => (availableOnly ? t.status === "ว่าง" : true)),
    [tables, zonefilter, availableOnly]
  );

  const countNextIndex = (z: Zone) => tables.filter((t) => t.zone === z).length + 1;

  const makeTableNode = (zone: Zone, size: Tabletype, x: number, y: number): TableNode => ({
    id: guid(),
    label: `${zone}${countNextIndex(zone)}`,
    desc: "",
    zone, size,
    seats: DEFAULT_SEATS[size],
    status: "ว่าง",
    x, y,
    shape: "Square",
  });

  const makeObjectNode = (type: ObjectType, x: number, y: number): ObjectNode => {
    const d = DEFAULT_OBJECT_SIZE[type];
    return { id: guid(), label: d.label, type, x, y, width: d.w, height: d.h, color: d.color };
  };

  const handlePlanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !adding) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    const y = clamp01((e.clientY - rect.top) / rect.height);

    if (adding.kind === "table") {
      const node = makeTableNode(adding.zone, adding.size, x, y);
      setTables((prev) => [...prev, node]);
      setSelected(node);
    } else {
      const obj = makeObjectNode(adding.objectType, x, y);
      setObjects((prev) => [...prev, obj]);
      setSelected(obj);
    }
    setAdding(null);
    setToastMsg("เพิ่มเรียบร้อย");
  };

  const onPointerDown = (e: React.PointerEvent, item: TableNode | ObjectNode) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = item.x * rect.width;
    const py = item.y * rect.height;
    dragInfo.current = {
      id: item.id,
      type: ("zone" in item) ? "table" : "object",
      offsetX: e.clientX - (rect.left + px),
      offsetY: e.clientY - (rect.top + py),
    };
    setDragging(true);
    contentRef.current?.scrollToPoint?.(0, 0, 0);
    e.preventDefault();
    e.stopPropagation();
  };

  const onPointerMovePlan = (e: React.PointerEvent) => {
    if (!dragInfo.current || !containerRef.current) return;
    const { id, type, offsetX, offsetY } = dragInfo.current;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left - offsetX) / rect.width);
    const y = clamp01((e.clientY - rect.top - offsetY) / rect.height);

    if (type === "table") {
      setTables((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    } else {
      setObjects((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    }
    e.preventDefault();
  };

  const onPointerUpPlan = (e: React.PointerEvent) => {
    dragInfo.current = null;
    setDragging(false);
    e.preventDefault();
  };

  const updateSelected = (partial: Partial<TableNode & ObjectNode>) => {
    if (!selected) return;
    if ("zone" in selected) {
      const merged = { ...selected, ...partial } as TableNode;
      setTables((prev) => prev.map((n) => (n.id === merged.id ? merged : n)));
      setSelected(merged);
    } else {
      const merged = { ...selected, ...partial } as ObjectNode;
      if (merged.width !== undefined) merged.width = clamp01(merged.width);
      if (merged.height !== undefined) merged.height = clamp01(merged.height);
      setObjects((prev) => prev.map((n) => (n.id === merged.id ? merged : n)));
      setSelected(merged);
    }
  };

  const removeSelected = () => {
    if (!selected) return;
    if ("zone" in selected) setTables((prev) => prev.filter((n) => n.id !== selected.id));
    else setObjects((prev) => prev.filter((n) => n.id !== selected.id));
    setSelected(null);
    setToastMsg("ลบเรียบร้อย");
  };

  return (
    <IonPage>
      <IonHeader mode="md">
        <IonToolbar>
          <IonTitle>Floor plan - Staff (Prototype)</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setAdding({ kind: "table", zone: "A", size: "SMALL" })}>+ Table A</IonButton>
            <IonButton onClick={() => setAdding({ kind: "table", zone: "B", size: "MEDIUM" })}>+ Table B</IonButton>
            <IonButton fill="outline" onClick={() => setAdding({ kind: "object", objectType: "Stage" })}>+ Stage</IonButton>
            <IonButton fill="outline" onClick={() => setAdding({ kind: "object", objectType: "Screen" })}>+ Screen</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent ref={contentRef} fullscreen scrollY={!dragging}>
        <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
          <IonChip color="success" onClick={() => setAvailableOnly((v) => !v)}>
            เฉพาะว่าง: {availableOnly ? "On" : "Off"}
          </IonChip>
          <IonChip color="medium">ลากเพื่อย้าย, คลิกเพื่อแก้ไข</IonChip>
        </div>

        <div style={{ padding: "0 16px 12px 16px" }}>
          <IonSegment value={zonefilter} onIonChange={(e) => setZoneFilter((e.detail.value as any) ?? "ALL")}>
            <IonSegmentButton value="ALL"><IonLabel>All Zone</IonLabel></IonSegmentButton>
            <IonSegmentButton value="A"><IonLabel>Zone A</IonLabel></IonSegmentButton>
            <IonSegmentButton value="B"><IonLabel>Zone B</IonLabel></IonSegmentButton>
          </IonSegment>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          onPointerMove={onPointerMovePlan}
          onPointerUp={onPointerUpPlan}
          onPointerCancel={onPointerUpPlan}
          onClick={handlePlanClick}
          style={{
            position: "relative",
            width: "96%",
            height: 520,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "#171717",
            overflow: "hidden",
            margin: "0 auto 12px",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px, 32px 32px",
          }}
        >
          {/* Objects */}
          {objects.map((o) => (
            <div
              key={o.id}
              onPointerDown={(e) => onPointerDown(e, o)}
              onClick={(e) => { e.stopPropagation(); setSelected(o); }}
              title={o.label}
              style={{
                position: "absolute",
                left: `${o.x * 100}%`,
                top: `${o.y * 100}%`,
                width: `${o.width * 100}%`,
                height: `${o.height * 100}%`,
                transform: "translate(-50%, -50%)",
                background: o.color,
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                color: "#111",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
                touchAction: "none",
                cursor: "grab",
              }}
            >
              {o.label}
            </div>
          ))}

          {/* Tables */}
          {shownTables.map((t) => {
            const c = statusColor[t.status];
            return (
              <div
                key={t.id}
                onPointerDown={(e) => onPointerDown(e, t)}
                onClick={(e) => { e.stopPropagation(); setSelected(t); }}
                title={t.label}
                style={{
                  position: "absolute",
                  left: `${t.x * 100}%`,
                  top: `${t.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                  borderRadius: 22,
                  border: `1px solid ${c.border}`,
                  padding: "8px 12px",
                  background: c.bg,
                  color: "#e2e8f0",
                  cursor: "grab",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                  fontWeight: 700,
                  userSelect: "none",
                  touchAction: "none",
                }}
              >
                {t.label}
              </div>
            );
          })}
        </div>

        {/* Editor Modal */}
        <IonModal isOpen={!!selected} onDidDismiss={() => setSelected(null)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{selected ? `แก้ไข: ${selected.label}` : "Edit"}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setSelected(null)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent style={{ padding: 16 }}>
            {selected && "zone" in selected ? (
              <>
                <IonItem><IonLabel position="stacked">Label</IonLabel>
                  <IonInput value={selected.label} onIonChange={(e) => updateSelected({ label: e.detail.value || "" })}/>
                </IonItem>
                <IonItem><IonLabel position="stacked">Seats</IonLabel>
                  <IonInput type="number" inputMode="numeric" value={String(selected.seats)}
                    onIonChange={(e) => updateSelected({ seats: Math.max(1, parseInt(e.detail.value || "1", 10)) })}/>
                </IonItem>
                <IonItem><IonLabel position="stacked">Zone</IonLabel>
                  <IonSelect value={selected.zone} onIonChange={(e) => updateSelected({ zone: e.detail.value as Zone })}>
                    <IonSelectOption value="A">A</IonSelectOption>
                    <IonSelectOption value="B">B</IonSelectOption>
                  </IonSelect>
                </IonItem>
                <IonItem><IonLabel position="stacked">Status</IonLabel>
                  <IonSelect value={selected.status} onIonChange={(e) => updateSelected({ status: e.detail.value as Status })}>
                    <IonSelectOption value="ว่าง">ว่าง</IonSelectOption>
                    <IonSelectOption value="จองแล้ว">จองแล้ว</IonSelectOption>
                    <IonSelectOption value="ไม่ว่าง">ไม่ว่าง</IonSelectOption>
                  </IonSelect>
                </IonItem>
                <IonItem><IonLabel position="stacked">Description</IonLabel>
                  <IonTextarea autoGrow value={selected.desc ?? ""} onIonChange={(e) => updateSelected({ desc: e.detail.value ?? "" })}/>
                </IonItem>
                <div style={{ fontSize: 12, opacity: .7, marginTop: 8 }}>
                  ตำแหน่ง: x {(selected.x*100).toFixed(1)}% · y {(selected.y*100).toFixed(1)}%
                </div>
              </>
            ) : selected ? (
              <>
                <IonItem><IonLabel position="stacked">ประเภท</IonLabel>
                  <IonSelect value={(selected as ObjectNode).type}
                    onIonChange={(e) => updateSelected({ type: e.detail.value as ObjectType, label: e.detail.value })}>
                    <IonSelectOption value="Stage">Stage</IonSelectOption>
                    <IonSelectOption value="Screen">Screen</IonSelectOption>
                  </IonSelect>
                </IonItem>
                <IonItem><IonLabel position="stacked">Label</IonLabel>
                  <IonInput value={selected.label} onIonChange={(e) => updateSelected({ label: e.detail.value || "" })}/>
                </IonItem>
                <IonItem><IonLabel position="stacked">สี (hex/rgb)</IonLabel>
                  <IonInput value={(selected as ObjectNode).color}
                    onIonChange={(e) => updateSelected({ color: e.detail.value || "" })}/>
                </IonItem>
                <IonItem><IonLabel position="stacked">กว้าง (0..1)</IonLabel>
                  <IonInput type="number" inputMode="decimal" step="0.01" value={String((selected as ObjectNode).width)}
                    onIonChange={(e) => updateSelected({ width: parseFloat(e.detail.value || "0.1") })}/>
                </IonItem>
                <IonItem><IonLabel position="stacked">สูง (0..1)</IonLabel>
                  <IonInput type="number" inputMode="decimal" step="0.01" value={String((selected as ObjectNode).height)}
                    onIonChange={(e) => updateSelected({ height: parseFloat(e.detail.value || "0.1") })}/>
                </IonItem>
                <div style={{ fontSize: 12, opacity: .7, marginTop: 8 }}>
                  ตำแหน่ง: x {(selected.x*100).toFixed(1)}% · y {(selected.y*100).toFixed(1)}%
                </div>
              </>
            ) : null}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <IonButton color="danger" onClick={removeSelected}>Delete</IonButton>
              <IonButton color="success" onClick={() => setSelected(null)}>Done</IonButton>
            </div>
          </IonContent>

          <IonFooter><IonToolbar /></IonFooter>
        </IonModal>

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={1500} onDidDismiss={() => setToastMsg("")}/>
      </IonContent>
    </IonPage>
  );
};

export default Selecttable;
