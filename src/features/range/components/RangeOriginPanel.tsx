import { Badge } from "../../../shared/components/Badge";
import type { RangeGridInfo, RangeTrackedItem } from "../rangeTypes";

type Props = { origin?: RangeTrackedItem; gridInfo: RangeGridInfo };

export function RangeOriginPanel({ gridInfo, origin }: Props) {
  return <div className="range-origin-panel"><div><span className="range-label">Origine</span><strong>{origin?.name ?? "Aucune origine"}</strong>{origin ? <p>{Math.round(origin.center.x)}, {Math.round(origin.center.y)} px</p> : <p>Sélectionnez un item depuis le menu contextuel Owlbear.</p>}</div><div className="range-grid-info"><Badge>DPI : {gridInfo.dpi ?? "n/a"}</Badge><Badge>Scale : {gridInfo.rawScale ?? "n/a"}</Badge></div></div>;
}
