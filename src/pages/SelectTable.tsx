import React, { useMemo, useRef, useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonSegment, IonSegmentButton, IonLabel,
  IonChip, IonModal, IonItem, IonInput, IonSelect, IonSelectOption,
  IonTextarea, IonFooter, IonToast, useIonAlert, IonPopover, IonIcon
} from "@ionic/react";
import {informationCircle, personCircle, personCircleOutline} from "ionicons/icons"

/** ---------- Types ---------- */
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
  x: number; 
  y: number; 
  size: Tabletype;
  shape: Tableshape;
  sizeRatio: number; //  container
  groupId?: string;  // กลุ่ม
}

interface ObjectNode {
  id: string;
  label: string;
  type: ObjectType;
  x: number;      // 0..1
  y: number;      // 0..1
  width: number;  // 0..1
  height: number; // 0..1
  color: string;
}

/** ---------- Utils ---------- */
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const guid = () => (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));

const statusColor: Record<Status, { color: string; bg: string; border: string }> = {
  ว่าง:    { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(52,211,153,0.4)" },
  จองแล้ว: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(251,191,36,0.4)" },
  ไม่ว่าง:  { color: "#f43f5e", bg: "rgba(244,63,94,0.15)",  border: "rgba(251,113,133,0.4)" },
};

const TABLE_VISUAL: Record<Tabletype, number> = {
  SMALL: 0.06,
  MEDIUM: 0.075,
  LARGE: 0.09,
};
const TABLE_MIN = 0.04;
const TABLE_MAX = 0.14;

const DEFAULT_SEATS: Record<Tabletype, number> = { SMALL: 2, MEDIUM: 4, LARGE: 6 };
const DEFAULT_OBJECT_SIZE: Record<ObjectType, { w: number; h: number; color: string; label: string }> = {
  Stage:  { w: 0.3, h: 0.15, color: "#f59e0b", label: "Stage" },
  Screen: { w: 0.1, h: 0.08, color: "#34d399", label: "Screen" },
};

/** ---------- Seed Data ---------- */
const seedTables: TableNode[] = [
  { id: guid(), label: "A1", zone: "A", seats: 4, status: "ว่าง",    x: 0.20, y: 0.30, size: "MEDIUM", shape: "Square", sizeRatio: TABLE_VISUAL.MEDIUM },
  { id: guid(), label: "A2", zone: "A", seats: 2, status: "จองแล้ว", x: 0.35, y: 0.30, size: "MEDIUM",  shape: "Square", sizeRatio: TABLE_VISUAL.MEDIUM  },
  { id: guid(), label: "B1", zone: "B", seats: 6, status: "ว่าง",    x: 0.65, y: 0.65, size: "MEDIUM",  shape: "Square", sizeRatio: TABLE_VISUAL.MEDIUM  },
];

const seedObjects: ObjectNode[] = [
  { id: guid(), label: "Stage",  type: "Stage",  x: 0.50, y: 0.12, width: 0.40, height: 0.12, color: "#f59e0b" },
  { id: guid(), label: "Screen", type: "Screen", x: 0.85, y: 0.18, width: 0.12, height: 0.08, color: "#34d399" },
];

/** ---------- Component ---------- */
const Selecttable: React.FC = () => {
  const [presentAlert] = useIonAlert();

  const [savedTables, setSavedTables] = useState<TableNode[]>(seedTables);
  const [savedObjects, setSavedObjects] = useState<ObjectNode[]>(seedObjects);

  const [tables, setTables] = useState<TableNode[]>(seedTables);
  const [objects, setObjects] = useState<ObjectNode[]>(seedObjects);

  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [zonefilter, setZoneFilter] = useState<Zone | "ALL">("ALL");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selected, setSelected] = useState<TableNode | ObjectNode | null>(null);
  const [adding, setAdding] = useState<Adding>(null);
  const [toastMsg, setToastMsg] = useState("");

  const [joinMode, setJoinMode] = useState(false);
  const [joinSelection, setJoinSelection] = useState<Set<string>>(new Set()); // id ของ โต๊ะ

  // canvas/drag
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLIonContentElement | null>(null);
  const dragInfo = useRef<{ id: string; type: "table" | "object"; offsetX: number; offsetY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // ตารางที่แสดง (ตาม filter) 
  const shownTables = useMemo(
    () => tables
      .filter((t) => (zonefilter === "ALL" ? true : t.zone === zonefilter))
      .filter((t) => (availableOnly ? t.status === "ว่าง" : true)),
    [tables, zonefilter, availableOnly]
  );

  /** Helpers */
  const countNextIndex = (z: Zone) => tables.filter((t) => t.zone === z).length + 1;

  const makeTableNode = (zone: Zone, size: Tabletype, x: number, y: number): TableNode => ({
    id: guid(),
    label: `${zone}${countNextIndex(zone)}`,
    desc: "",
    zone,
    size,
    seats: DEFAULT_SEATS[size],
    status: "ว่าง",
    x, y,
    shape: "Square",
    sizeRatio: TABLE_VISUAL[size],
  });

  const makeObjectNode = (type: ObjectType, x: number, y: number): ObjectNode => {
    const d = DEFAULT_OBJECT_SIZE[type];
    return { id: guid(), label: d.label, type, x, y, width: d.w, height: d.h, color: d.color };
  };

  /** Enter/Cancel/Save edit */
  const enterEditMode = () => {
    setTables(JSON.parse(JSON.stringify(savedTables)));
    setObjects(JSON.parse(JSON.stringify(savedObjects)));
    setSelected(null);
    setAdding(null);
    setDirty(false);
    setJoinMode(false);
    setJoinSelection(new Set());
    setEditMode(true);
  };

  const cancelChanges = () => {
    setTables(JSON.parse(JSON.stringify(savedTables)));
    setObjects(JSON.parse(JSON.stringify(savedObjects)));
    setSelected(null);
    setAdding(null);
    setDirty(false);
    setEditMode(false);
    setJoinMode(false);
    setJoinSelection(new Set());
    setToastMsg("ยกเลิกการเปลี่ยนแปลง");
  };

  const saveChanges = () => {
    setSavedTables(JSON.parse(JSON.stringify(tables)));
    setSavedObjects(JSON.parse(JSON.stringify(objects)));
    setDirty(false);
    setEditMode(false);
    setSelected(null);
    setAdding(null);
    setJoinMode(false);
    setJoinSelection(new Set());
    setToastMsg("บันทึกสำเร็จ");
  };

  // Add node by clicking on canvas 
  const handlePlanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !adding || !editMode) return;
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
    setDirty(true);
  };

 
  const togglePick = (id: string) => {
    setJoinSelection(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const confirmJoin = () => {
    if (joinSelection.size < 2) return;
    const newGroupId = guid();
    const updatedtable = tables.map(t => (joinSelection.has(t.id) ? { ...t, groupId: newGroupId } : t));
    setTables(updatedtable)
    console.log(updatedtable)
    setDirty(true);
    setJoinMode(false);
    setJoinSelection(new Set());
    setToastMsg("ต่อโต๊ะรวมกลุ่มแล้ว");
  };

  // Drag node
  const onPointerDown = (e: React.PointerEvent, item: TableNode | ObjectNode) => {
    if (!editMode || !containerRef.current) return;
    if (joinMode) return; // ไม่ให้ลากตอน join mode
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
    if (!editMode || !dragInfo.current || !containerRef.current) return;
    const { id, type, offsetX, offsetY } = dragInfo.current;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left - offsetX) / rect.width);
    const y = clamp01((e.clientY - rect.top - offsetY) / rect.height);

    if (type === "table") setTables((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    else setObjects((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));

    setDirty(true);
    e.preventDefault();
  };

  const onPointerUpPlan = (e: React.PointerEvent) => {
    dragInfo.current = null;
    setDragging(false);
    e.preventDefault();
  };

  // >>> Modal 
  const updateSelected = (partial: Partial<TableNode & ObjectNode>) => {
    if (!selected) return;
    if ("zone" in selected) {
      const merged = { ...selected, ...partial } as TableNode;
      if (typeof (merged as any).sizeRatio === "number") {
        merged.sizeRatio = Math.max(TABLE_MIN, Math.min(TABLE_MAX, merged.sizeRatio));
      }
      setTables((prev) => prev.map((n) => (n.id === merged.id ? merged : n)));
      setSelected(merged);
    } else {
      const merged = { ...selected, ...partial } as ObjectNode;
      if (merged.width !== undefined) merged.width = clamp01(merged.width);
      if (merged.height !== undefined) merged.height = clamp01(merged.height);
      setObjects((prev) => prev.map((n) => (n.id === merged.id ? merged : n)));
      setSelected(merged);
    }
    setDirty(true);
  };

  const removeSelected = () => {
    if (!selected) return;
    presentAlert({
      header: "ลบรายการ?",
      message: `ต้องการลบ "${selected.label}" ใช่ไหม`,
      buttons: [
        "ไม่",
        {
          text: "ลบ",
          role: "destructive",
          handler: () => {
            if ("zone" in selected) setTables((prev) => prev.filter((n) => n.id !== selected.id));
            else setObjects((prev) => prev.filter((n) => n.id !== selected.id));
            setSelected(null);
            setDirty(true);
            setToastMsg("ลบเรียบร้อย");
          },
        },
      ],
    });
  };

  // >>>> Render
  return (
    <IonPage>
      <IonHeader mode="md">
        <IonToolbar>
          <IonTitle>Floor plan - Staff {editMode ? "(Editing…)" : ""}</IonTitle>
          <IonButtons slot="end">
            {!editMode ? (
              <IonButton onClick={enterEditMode}>Edit</IonButton>
            ) : (
              <>
                {!joinMode ? (
                  <>
                    <IonButton color="success" onClick={saveChanges} disabled={!dirty}>Save</IonButton>
                    <IonButton color="medium" onClick={cancelChanges}>Cancel</IonButton>
                    <IonButton onClick={() => { setJoinMode(true); setJoinSelection(new Set()); }}>
                      Join
                    </IonButton>
                  </>
                ) : (
                  <>
                    <IonButton color="success" onClick={confirmJoin} disabled={joinSelection.size < 2}>
                      Confirm Join
                    </IonButton>
                    <IonButton color="medium" onClick={() => { setJoinMode(false); setJoinSelection(new Set()); }}>
                      Cancel Join
                    </IonButton>
                  </>
                )}
              </>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent ref={contentRef} fullscreen scrollY={!dragging}>
        <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
          <IonChip color="success" onClick={() => setAvailableOnly((v) => !v)}>
            แสดงเฉพาะว่าง: {availableOnly ? "On" : "Off"}
          </IonChip>
          <IonChip color={editMode ? "warning" : "medium"}>
            {editMode ? (dirty ? "มีการทำงานเปลี่ยนแปลง" : "โหมดแก้ไข") : "โหมดดูผัง"}
          </IonChip>
          {joinMode && (
            <IonChip color="tertiary">เลือกอยู่: {joinSelection.size}</IonChip>
          )}
        </div>

        <div style={{ padding: "0 16px 12px 16px" }}>
          <IonSegment value={zonefilter} onIonChange={(e) => setZoneFilter((e.detail.value as any) ?? "ALL")}>
            <IonSegmentButton value="ALL"><IonLabel>All Zone</IonLabel></IonSegmentButton>
            <IonSegmentButton value="A"><IonLabel>Zone A</IonLabel></IonSegmentButton>
            <IonSegmentButton value="B"><IonLabel>Zone B</IonLabel></IonSegmentButton>
          </IonSegment>
        </div>

        {editMode && (
          <div style={{ display: "flex", gap: 8, padding: "0 16px 12px 16px" }}>
            <IonButton fill="default" onClick={() => setAdding({ kind: "table", zone: "A", size: "SMALL" })}>+ Table A</IonButton>
            <IonButton fill="default" onClick={() => setAdding({ kind: "table", zone: "B", size: "MEDIUM" })}>+ Table B</IonButton>
            <IonButton fill="outline" onClick={() => setAdding({ kind: "object", objectType: "Stage" })}>+ Stage</IonButton>
            <IonButton fill="outline" onClick={() => setAdding({ kind: "object", objectType: "Screen" })}>+ Screen</IonButton>
          </div>
        )}

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
          {/* Objects (ไม่ยุ่งกับ join) */}
          {objects.map((o) => (
            <div
              key={o.id}
              onPointerDown={(e) => onPointerDown(e, o)}
              onClick={(e) => {
                e.stopPropagation();
                if (!editMode) return;
                setSelected(o);
              }}
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
                cursor: editMode ? "grab" : "default",
                opacity: editMode ? 1 : 0.95,
              }}
            >
              {o.label}
            </div>
          ))}

          {/* Tables (รองรับ join) */}
          {shownTables.map((t) => {
            const c = statusColor[t.status];
            const sidePct = t.sizeRatio * 100;
            const isCircle = t.shape === "Circle";
            const picked = joinMode && joinSelection.has(t.id);
            const inGroup = !!t.groupId;

            return (
              <div
                key={t.id}
                onPointerDown={(e) => onPointerDown(e, t)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!editMode) return;
                  if (joinMode) togglePick(t.id);
                  else setSelected(t);
                }}
                title={t.label}
                style={{
                  position: "absolute",
                  left: `${t.x * 100}%`,
                  top: `${t.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                  width: `${sidePct}%`,
                  height: `${sidePct}%`,
                  borderRadius: isCircle ? "50%" : 12,
                  border: picked ? `2px dashed ${c.border}` : `1px solid ${c.border}`,
                  boxShadow: inGroup ? "0 0 0 2px rgba(59,130,246,0.35)" : "0 2px 8px rgba(0,0,0,0.35)",
                  background: c.bg,
                  color: "#e2e8f0",
                  cursor: editMode ? "grab" : "default",
                  fontWeight: 700,
                  userSelect: "none",
                  touchAction: "none",
                  opacity: editMode ? 1 : 0.95,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              ><div style={{ position: "relative", width: "100%", height: "100%", display: "flex", justifyContent:"center", alignItems: "center"}}>
                <div style= {{ position: "absolute" , bottom: "-100%", width: "100%", height: "100%" , display: "flex", justifyContent: "center", alignItems: "center"}}>
                 <IonIcon icon={personCircleOutline}></IonIcon> &nbsp; {t.seats}
                </div>
                {t.label}
                </div>
              </div>
            );
          })}

          {editMode && adding && (
            <div
              style={{
                position: "absolute", left: 8, top: 8,
                background: "#22d3ee", color: "#0b4eea",
                borderRadius: 12, padding: "6px 10px", fontWeight: 700,
                boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
              }}
            >
              แตะที่แผนผังเพื่อเพิ่ม {adding.kind === "table" ? "โต๊ะ" : adding.objectType}
            </div>
          )}
        </div>

        {/* Editor Modal */}
        <IonModal isOpen={!!selected && editMode} onDidDismiss={() => setSelected(null)}>
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
                <IonItem>
                  <IonLabel position="stacked">หมายเลขโต๊ะ</IonLabel>
                  <IonInput value={selected.label} onIonChange={(e) => updateSelected({ label: e.detail.value || "" })} />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">ประเภทโต๊ะ</IonLabel>
                  <IonSelect value={selected.shape} onIonChange={(e) => updateSelected({ shape: e.detail.value as Tableshape })}>
                    <IonSelectOption value="Square">สี่เหลี่ยม</IonSelectOption>
                    <IonSelectOption value="Circle">วงกลม</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">ขนาดโต๊ะ (0.04 - 0.14)</IonLabel>
                  <IonInput
                    type="number"
                    inputMode="decimal"
                    step="0.005"
                    value={String(selected.sizeRatio)}
                    onIonChange={(e) => {
                      const v = Number(e.detail.value ?? selected.sizeRatio);
                      const clamped = Math.max(TABLE_MIN, Math.min(TABLE_MAX, v));
                      updateSelected({ sizeRatio: clamped });
                    }}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">จำนวนที่นั่ง</IonLabel>
                  <IonInput
                    type="number"
                    inputMode="numeric"
                    value={String(selected.seats)}
                    onIonChange={(e) => updateSelected({ seats: Math.max(1, parseInt(e.detail.value || "1", 10)) })}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">โซน</IonLabel>
                  <IonSelect value={selected.zone} onIonChange={(e) => updateSelected({ zone: e.detail.value as Zone })}>
                    <IonSelectOption value="A">A</IonSelectOption>
                    <IonSelectOption value="B">B</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">สถานะ</IonLabel>
                  <IonSelect value={selected.status} onIonChange={(e) => updateSelected({ status: e.detail.value as Status })}>
                    <IonSelectOption value="ว่าง">ว่าง</IonSelectOption>
                    <IonSelectOption value="จองแล้ว">จองแล้ว</IonSelectOption>
                    <IonSelectOption value="ไม่ว่าง">ไม่ว่าง</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">หมายเหตุ</IonLabel>
                  <IonTextarea autoGrow value={selected.desc ?? ""} onIonChange={(e) => updateSelected({ desc: e.detail.value ?? "" })} />
                </IonItem>

                {selected.groupId && (
                  <IonButton
                    color="warning"
                    onClick={() => updateSelected({ groupId: undefined })}
                    style={{ marginTop: 12 }}
                  >
                    Remove from group
                  </IonButton>
                )}
              </>
            ) : selected ? (
              <>
                <IonItem>
                  <IonLabel position="stacked">ประเภท</IonLabel>
                  <IonSelect
                    value={(selected as ObjectNode).type}
                    onIonChange={(e) => updateSelected({ type: e.detail.value as ObjectType, label: e.detail.value })}
                  >
                    <IonSelectOption value="Stage">Stage</IonSelectOption>
                    <IonSelectOption value="Screen">Screen</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Label</IonLabel>
                  <IonInput value={selected.label} onIonChange={(e) => updateSelected({ label: e.detail.value || "" })} />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">กว้าง (0..1)</IonLabel>
                  <IonInput
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={String((selected as ObjectNode).width)}
                    onIonChange={(e) => updateSelected({ width: parseFloat(e.detail.value || "0.1") })}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">สูง (0..1)</IonLabel>
                  <IonInput
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={String((selected as ObjectNode).height)}
                    onIonChange={(e) => updateSelected({ height: parseFloat(e.detail.value || "0.1") })}
                  />
                </IonItem>
              </>
            ) : null}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <IonButton color="danger" onClick={removeSelected} disabled={!editMode}>Delete</IonButton>
              <IonButton color="success" onClick={() => setSelected(null)}>Done</IonButton>
            </div>
          </IonContent>

          <IonFooter><IonToolbar /></IonFooter>
        </IonModal>

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={1500} onDidDismiss={() => setToastMsg("")} />
      </IonContent>
    </IonPage>
  );
};

export default Selecttable;
