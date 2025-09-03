import React, { useMemo, useRef, useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonSegment, IonSegmentButton, IonLabel,
  IonModal, IonItem, IonInput, IonTextarea, IonToast, IonChip, IonIcon
} from "@ionic/react";
import { personCircleOutline } from "ionicons/icons";

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
  x: number; // 0..1
  y: number; // 0..1
  size: Tabletype;
  shape: Tableshape;
}

const guid = () => (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));

const statusColor: Record<Status, { color: string; bg: string; border: string }> = {
  ว่าง: { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(52,211,153,0.4)" },
  จองแล้ว: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(251,191,36,0.4)" },
  ไม่ว่าง: { color: "#f43f5e", bg: "rgba(244,63,94,0.15)", border: "rgba(251,113,133,0.4)" },
};

// ตัวอย่างโต๊ะ
const seedTables: TableNode[] = [
  { id: guid(), label: "A1", zone: "A", seats: 4, status: "ว่าง",    x: 0.22, y: 0.32, size: "MEDIUM", shape: "Square" },
  { id: guid(), label: "A2", zone: "A", seats: 2, status: "ว่าง",    x: 0.38, y: 0.32, size: "SMALL",  shape: "Circle" },
  { id: guid(), label: "B1", zone: "B", seats: 6, status: "ว่าง",    x: 0.65, y: 0.62, size: "LARGE",  shape: "Square" },
  { id: guid(), label: "B2", zone: "B", seats: 4, status: "จองแล้ว", x: 0.78, y: 0.62, size: "MEDIUM", shape: "Square" },
];

const UserSelectTable: React.FC = () => {
  // filter + ข้อมูลโต๊ะทั้งหมด
  const [zonefilter, setZoneFilter] = useState<Zone | "ALL">("ALL");
  const [tables, setTables] = useState<TableNode[]>(seedTables);

  // ชุดที่ผู้ใช้ “เลือกไว้”
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());

  // โมดัลจอง
  const [bookingOpen, setBookingOpen] = useState(false);
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [time, setTime]   = useState("");
  const [note, setNote]   = useState("");

  const [toastMsg, setToastMsg] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);

  // filter ตารางที่แสดง
  const shown = useMemo(
    () => tables.filter((t) => (zonefilter === "ALL" ? true : t.zone === zonefilter)),
    [tables, zonefilter]
  );

  // รวม seats ของโต๊ะที่เลือก
  const pickedList = useMemo(
    () => tables.filter(t => pickedIds.has(t.id)),
    [tables, pickedIds]
  );
  const totalSeats = useMemo(
    () => pickedList.reduce((sum, t) => sum + (t.seats || 0), 0),
    [pickedList]
  );

  // toggle เลือก/ยกเลิกเลือก
  const togglePick = (t: TableNode) => {
    if (t.status !== "ว่าง") return; // เลือกได้เฉพาะ "ว่าง"
    setPickedIds(prev => {
      const next = new Set(prev);
      if (next.has(t.id)) next.delete(t.id);
      else next.add(t.id);
      return next;
    });
  };

  // เปิดโมดัล “ถัดไป”
  const openBooking = () => {
    if (pickedIds.size === 0) {
      setToastMsg("กรุณาเลือกโต๊ะอย่างน้อย 1 ตัว");
      return;
    }
    setBookingOpen(true);
  };

  // ยืนยันการจอง (prototype)
  const confirmBooking = () => {
    if (!name || !phone || !time) {
      setToastMsg("กรอก ชื่อ/โทร/เวลา ให้ครบก่อน");
      return;
    }
    // อัปเดตสถานะโต๊ะที่ถูกเลือกทั้งหมด -> “จองแล้ว”
    setTables(prev =>
      prev.map(t =>
        pickedIds.has(t.id)
          ? { ...t, status: "จองแล้ว", desc: note?.trim() || t.desc }
          : t
      )
    );
    setPickedIds(new Set());
    setBookingOpen(false);
    setName(""); setPhone(""); setTime(""); setNote("");
    setToastMsg("จองสำเร็จ (Prototype)");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>เลือกโต๊ะ</IonTitle>

          <IonButtons slot="end">
            <IonButton onClick={openBooking} strong={true}>
              ถัดไป {pickedIds.size > 0 ? `(${pickedIds.size})` : ""}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Filter */}
        <IonSegment
          value={zonefilter}
          onIonChange={(e) => setZoneFilter((e.detail.value as any) ?? "ALL")}
        >
          <IonSegmentButton value="ALL"><IonLabel>ทั้งหมด</IonLabel></IonSegmentButton>
          <IonSegmentButton value="A"><IonLabel>Zone A</IonLabel></IonSegmentButton>
          <IonSegmentButton value="B"><IonLabel>Zone B</IonLabel></IonSegmentButton>
        </IonSegment>

        {/* Canvas / Plan */}
        <div
          ref={containerRef}
          style={{
            position: "relative",
            width: "96%",
            height: 520,
            margin: "16px auto",
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            background: "#111",
            overflow: "hidden",
          }}
        >
          {shown.map((t) => {
            const picked = pickedIds.has(t.id);
            const c = statusColor[t.status];
            const baseStyle: React.CSSProperties = {
              position: "absolute",
              left: `${t.x * 100}%`,
              top: `${t.y * 100}%`,
              transform: "translate(-50%, -50%)",
              color: "#fff",
              fontWeight: 700,
              userSelect: "none",
              touchAction: "none",
              cursor: t.status === "ว่าง" ? "pointer" : "not-allowed",
              background: c.bg,
              border: picked
                ? `2px solid #60a5fa` // ไฮไลต์เมื่อถูกเลือก
                : `1px solid ${c.border}`,
              boxShadow: picked ? "0 0 0 2px rgba(96,165,250,0.35)" : "0 2px 8px rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 8,
            };

            // ให้ Square = กล่องมน, Circle = กลมจริง ๆ
            const nodeStyle: React.CSSProperties =
              t.shape === "Circle"
                ? { ...baseStyle, width: 64, height: 64, borderRadius: "50%" }
                : { ...baseStyle, minWidth: 68, height: 44, borderRadius: 14, padding: "8px 12px" };

            return (
              <div
                key={t.id}
                style={nodeStyle}
                onClick={() => togglePick(t)}
                title={`${t.label} (${t.status})`}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
                  <div>{t.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    <IonIcon icon={personCircleOutline} />
                    <span>{t.seats}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* แสดงสรุปสั้น ๆ ใต้แผนผัง */}
        <div style={{ width: "96%", margin: "0 auto 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {pickedList.length > 0 && (
            <>
              <IonChip color="tertiary">เลือกแล้ว: {pickedList.map(t => t.label).join(", ")}</IonChip>
              <IonChip color="success">รวมที่นั่ง: {totalSeats}</IonChip>
            </>
          )}
        </div>

        {/* Modal กรอกรายละเอียดจอง */}
        <IonModal isOpen={bookingOpen} onDidDismiss={() => setBookingOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>ยืนยันการจอง ({pickedList.length} โต๊ะ / {totalSeats} ที่นั่ง)</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent style={{ padding: 16 }}>
            {/* แสดงโต๊ะที่เลือก */}
            <div style={{ marginBottom: 12, fontSize: 14, color: "#ccc" }}>
              โต๊ะ: {pickedList.map(t => t.label).join(", ")}
            </div>

            <IonItem>
              <IonLabel position="stacked">ชื่อ</IonLabel>
              <IonInput value={name} onIonChange={(e) => setName(e.detail.value || "")} />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">เบอร์โทร</IonLabel>
              <IonInput type="tel" value={phone} onIonChange={(e) => setPhone(e.detail.value || "")} />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">เวลา</IonLabel>
              <IonInput type="time" value={time} onIonChange={(e) => setTime(e.detail.value || "")} />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">หมายเหตุ</IonLabel>
              <IonTextarea value={note} onIonChange={(e) => setNote(e.detail.value || "")} />
            </IonItem>

            <IonButton expand="block" color="success" onClick={confirmBooking} style={{ marginTop: 12 }}>
              ยืนยันการจอง
            </IonButton>
            <IonButton expand="block" fill="outline" onClick={() => setBookingOpen(false)}>
              ย้อนกลับ
            </IonButton>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={!!toastMsg}
          duration={1800}
          message={toastMsg}
          onDidDismiss={() => setToastMsg("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default UserSelectTable;
