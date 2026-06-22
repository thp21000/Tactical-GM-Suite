import type { ObrReadyState } from "../../core/obr/obrReady";
import { Badge } from "../../shared/components/Badge";
import { Panel } from "../../shared/components/Panel";
import { RangeOriginPanel } from "./components/RangeOriginPanel";
import { RangePresetForm } from "./components/RangePresetForm";
import { RangeTargetList } from "./components/RangeTargetList";
import { RangeToolbar } from "./components/RangeToolbar";
import { useObrGridScale } from "./hooks/useObrGridScale";
import { useObrSceneItems } from "./hooks/useObrSceneItems";
import { useRangeContextMenu } from "./hooks/useRangeContextMenu";
import { useRangeState } from "./hooks/useRangeState";

type RangePageProps = { obr: ObrReadyState };

export function RangePage({ obr }: RangePageProps) {
  const gridInfo = useObrGridScale(obr.isReady);
  const { refreshItems } = useObrSceneItems(obr.isReady);
  const range = useRangeState(gridInfo);

  useRangeContextMenu({ isReady: obr.isReady, onAddTargets: range.addTargets, onClearTargets: range.clearTargets, onSetOrigin: range.setOrigin });

  return <div className="stack range-page"><Panel><div className="range-header"><div><p className="eyebrow">Bloc actif</p><h1>Distance / Déplacement / Portée</h1><p>Mesure tactique entre tokens/items Owlbear.</p></div><Badge tone={obr.isReady ? "success" : "warning"}>{obr.modeLabel}</Badge></div></Panel><Panel><RangeOriginPanel origin={range.origin} gridInfo={gridInfo} /></Panel><Panel><RangeToolbar mode={range.preferences.measurementMode} unit={range.preferences.defaultUnit} presets={range.preferences.presets} selectedPresetId={range.preferences.selectedPresetId} onClearOrigin={range.clearOrigin} onClearTargets={range.clearTargets} onRefresh={refreshItems} onModeChange={range.setMeasurementMode} onUnitChange={range.setDefaultUnit} onPresetChange={range.setSelectedPresetId} /></Panel><Panel title="Cibles"><RangeTargetList measurements={range.measurements} unit={range.preferences.defaultUnit} /></Panel><Panel title="Presets de portée"><RangePresetForm presets={range.preferences.presets} onAddPreset={range.addPreset} onRemovePreset={range.removePreset} onResetPresets={range.resetPresets} /></Panel></div>;
}
