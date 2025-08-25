import React, { useMemo, useRef, useState } from "react";
import { CheckboxChangeEventDetail, CheckboxCustomEvent, IonButton, useIonModal, IonModal, IonTab } from "@ionic/react";


type Zone = "A" | "B";
type Status = "AVAILABLE" | "RESERVED" | "OCCUPIED";

interface TableNode {
    id: string;
    label: string;
    desc?: string
    status: Status;
    seats: number;
     x: number; // เป็น 0..1
  y: number; // เป็น 0..1
}

export const SelectTable = () => {
    const [adding, setAdding] = useState();
}

// const HandlePlanClick (e: React.MouseEvent) {
//     if(!adding || !containerRef.current) return:
//     const rect = containerRef.current.getBoundingClientRect();
//     const x = (e.clientX - rect.left) / rect.width;
//     const y = (e.clientY - rect.top) / rect.height
// }