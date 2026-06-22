import { Shield } from "lucide-react";
import type { ObrReadyState } from "../../core/obr/obrReady";
import { Badge } from "./Badge";
export function TopBar({ obr }: { obr: ObrReadyState }) { return <header className="topbar"><div className="brand"><Shield size={18}/><div><strong>Tactical GM Suite</strong><span>Core / Dashboard V1</span></div></div><Badge tone={obr.isReady ? "success" : "warning"}>{obr.modeLabel}</Badge></header>; }
