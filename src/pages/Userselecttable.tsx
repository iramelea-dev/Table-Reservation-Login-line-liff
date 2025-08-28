// src/pages/UserSelectTable.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel,
  IonItem, IonInput, IonTextarea, IonModal, IonButton, IonToast,
} from "@ionic/react";

type Tabletype = "SMALL" | "MEDIUM" | "LARGE";
type Zone = "A" | "B";
type Status = "ว่าง" | "จองแล้ว" | "ไม่ว่าง";
type Tableshape = "Square" | "Circle";

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
}

const guid = () => (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));

const statusColor: Record<Status, { color: string; bg: string; border: string }> = {
  ว่าง: { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(52,211,153,0.4)" },
  จองแล้ว: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(251,191,36,0.4)" },
  ไม่ว่าง: { color: "#f43f5e", bg: "rgba(244,63,94,0.15)", border: "rgba(251,113,133,0.4)" },
};

// seed ตารางตัวอย่าง (ไม่ต้องพึ่งหน้า Staff)
const seedTables: TableNode[] = [
  { id: guid(), label: "A1", zone: "A", seats: 4, status: "ว่าง", x: 0.22, y: 0.32, size: "MEDIUM", shape: "Square" },
  { id: guid(), label: "A2", zone: "A", seats: 2, status: "จองแล้ว", x: 0.38, y: 0.32, size: "SMALL", shape: "Square" },
  { id: guid(), label: "B1", zone: "B", seats: 6, status: "ว่าง", x: 0.65, y: 0.62, size: "LARGE", shape: "Square" },
];

const UserSelectTable: React.FC = () => {
  const [zonefilter, setZoneFilter] = useState<Zone | "ALL">("ALL");
  const [tables, setTables] = useState<TableNode[]>(seedTables);
  const [selected, setSelected] = useState<TableNode | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);

  const shown = useMemo(
    () => tables.filter((t) => (zonefilter === "ALL" ? true : t.zone === zonefilter)),
    [tables, zonefilter]
  );

  const handleBooking = () => {
    if (!selected) return;
    if (!name || !phone || !time) {
      setToastMsg("กรอกชื่อ/โทร/เวลา ให้ครบก่อนจอง");
      return;
    }
    // เปลี่ยนสถานะในหน้า (prototype)
    setTables((prev) => prev.map((t) => (t.id === selected.id ? { ...t, status: "จองแล้ว" } : t)));
    setSelected(null);
    setName(""); setPhone(""); setTime(""); setNote("");
    setToastMsg("จองสำเร็จ (Prototype)");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>เลือกโต๊ะ (Prototype)</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonSegment value={zonefilter} onIonChange={(e) => setZoneFilter((e.detail.value as any) ?? "ALL")}>
          <IonSegmentButton value="ALL"><IonLabel>ทั้งหมด</IonLabel></IonSegmentButton>
          <IonSegmentButton value="A"><IonLabel>Zone A</IonLabel></IonSegmentButton>
          <IonSegmentButton value="B"><IonLabel>Zone B</IonLabel></IonSegmentButton>
        </IonSegment>

        {/* Canvas / Plan (read-only) */}
        <div
          ref={containerRef}
          style={{
            position: "relative",
            width: "96%",
            height: 500,
            margin: "16px auto",
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            background: "#111",
          }}
        >
          {shown.map((t) => (
            <div
              key={t.id}
              style={{
                position: "absolute",
                left: `${t.x * 100}%`,
                top: `${t.y * 100}%`,
                transform: "translate(-50%, -50%)",
                background: statusColor[t.status].bg,
                border: `1px solid ${statusColor[t.status].border}`,
                borderRadius: 25,
                padding: "8px 12px",
                cursor: t.status === "ว่าง" ? "pointer" : "not-allowed",
                color: "#fff",
                fontWeight: 700,
              }}
              onClick={() => t.status === "ว่าง" && setSelected(t)}
              title={`${t.label} (${t.status})`}
            >
              {t.label}
            </div>
          ))}
        </div>

        {/* Booking Modal */}
        <IonModal isOpen={!!selected} onDidDismiss={() => setSelected(null)}>
          <IonHeader><IonToolbar><IonTitle>จองโต๊ะ {selected?.label}</IonTitle></IonToolbar></IonHeader>
          <IonContent style={{ padding: 16 }}>
            <IonItem><IonLabel position="stacked">ชื่อ</IonLabel>
              <IonInput value={name} onIonChange={(e) => setName(e.detail.value!)} />
            </IonItem>
            <IonItem><IonLabel position="stacked">เบอร์โทร</IonLabel>
              <IonInput type="tel" value={phone} onIonChange={(e) => setPhone(e.detail.value!)} />
            </IonItem>
            <IonItem><IonLabel position="stacked">เวลา</IonLabel>
              <IonInput type="time" value={time} onIonChange={(e) => setTime(e.detail.value!)} />
            </IonItem>
            <IonItem><IonLabel position="stacked">หมายเหตุ</IonLabel>
              <IonTextarea value={note} onIonChange={(e) => setNote(e.detail.value!)} />
            </IonItem>

            <IonButton expand="block" color="success" onClick={handleBooking}>ยืนยันการจอง</IonButton>
            <IonButton expand="block" fill="outline" onClick={() => setSelected(null)}>ยกเลิก</IonButton>
          </IonContent>
        </IonModal>

        <IonToast isOpen={!!toastMsg} duration={1800} message={toastMsg} onDidDismiss={() => setToastMsg("")}/>
      </IonContent>
    </IonPage>
  );
};

export default UserSelectTable;
