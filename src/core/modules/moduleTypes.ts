export type ModuleStatus = "core" | "next" | "planned" | "future" | "disabled";

export type GmSuiteModule = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  status: ModuleStatus;
  enabledByDefault: boolean;
  canDisable: boolean;
  order: number;
};
