import React, { useMemo, useRef, useState } from "react";
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonSegment, IonSegmentButton, IonLabel,
    IonItem, IonToggle, IonRange, IonChip, IonModal, IonInput, IonSelect, IonSelectOption,
    IonTextarea, IonFooter
} from "@ionic/react";

type Tabletype = "บาร์" | "นักร้อง"
type Zone = "A" | "B";
type Status = "ว่าง" | "จองแล้ว" | "ไม่ว่าง";

interface TableNode {
    id: string;
    zone: Zone
    label: string;
    status: Status;
    seats: number;
    desc?: string;
    x: number;
    y: number;
}
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp01 = (v: number) => Math.max(0, Math.min(1 , v))

export const SelectTable = () => {
    const [zonefilter, setZoneFilter] = useState<Zone | "ALL">("ALL");
    const [tables, setTables] = useState<TableNode[]>([]);
    const [available, setAvailable] = useState(false);
    const [adding, setAdding] = useState<Zone | null>(null);
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

    function countNextIndex(z: Zone) {
        const inZone = tables.filter((t) => t.zone === z);
        return inZone.length + 1;
    }

    function handlePlanClick(e: React.MouseEvent) {
        if (!adding || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left / rect.width);
        const y = (e.clientY - rect.top / rect.height);
        const node: TableNode = {
            id: uid(),
            label: `${adding}${countNextIndex(adding)}`,
            desc: "",
            zone: adding,
            seats: 2,
            status: "ว่าง",
        x: clamp01(x),
        y: clamp01(y),
        };
        setTables((prev) => [...prev, node]);
        setSelected(node);
        setAdding(null);
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
        setTables((prev) => prev.map((n) => (n.id === id ? { ...n,x,y}:n)));
        // e.preventDefault(); 
    }

    return (
        <IonPage>
            <IonHeader translucent>
                <IonToolbar>
                    <IonTitle> Floor plan - Ionic </IonTitle>
                    <IonButton onClick={() => setAdding("A")}> + Table A</IonButton>
                    <IonButton onClick={() => setAdding("B")}> + Table B</IonButton>
                </IonToolbar>
            </IonHeader>

            <IonContent ></IonContent>
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
                {/* <IonItem lines="none"> << this zoom in out type >>
                    <IonLabel>Zoom: {zoom.toFixed(2)}x</IonLabel>
                    <IonRange
                    min={1}
                    max={2}
                    step={0.1} 
                    value={zoom}
                    onIonChange={(e) => setZoom(Number(e.detail.value))}
                    />
                    
                </IonItem> */}
            </div>
            <div
                ref={containerRef}
                onPointerMove={onPointerMovePlan}
                onPointerUp={onPointerUpPlan}
                // { onPointerCancel={onPointerUpPlan} }
                onClick={handlePlanClick}
                 style={{
            position: "relative",
            // width: "96%",
            height: 520,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "#0f172a",
            overflow: "hidden",
            margin: "0 16px",
            // backgroundImage:
            //   "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            // backgroundSize: "32px 32px, 32px 32px",
            // Mobile
            // touchAction: "none",
            // userSelect: "none",
          }}
        >
            {/* <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              width: `calc(100% / ${zoom})`,
              height: `calc(100% / ${zoom})`,
              position: "relative",
            }}
          ></div> */}
            </div>
            
            <div
                style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                    width: `calc(100% / ${zoom})`,
                    height: `calc(20% / ${zoom})`,
                    position: "relative",
                }}
                >{shown.map((t) => {
              return (
                <div
                  key={t.id}
                  role="button"
                  // node
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
                    // border: `1px solid ${colors.border}`,
                    padding: "8px 12px",
                    // background: colors.bg,
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
       


                
        </IonPage>


    )
};

export default SelectTable;
