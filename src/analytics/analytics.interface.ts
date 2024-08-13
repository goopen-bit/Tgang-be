import { InitConfig } from "mixpanel";

export interface AnalyticsConfig {
  isGlobal?: boolean;
  mixpanelToken: string;
  config?: Partial<InitConfig>;
}
