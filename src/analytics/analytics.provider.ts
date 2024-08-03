import { Provider } from "@nestjs/common";
import { ANALYTICS_CLIENT, ANALYTICS_MODULE_OPTIONS } from "./analytics.constants";
import mixpanel from "mixpanel";
import { AnalyticsConfig } from "./analytics.interface";


export function createAnalyticsProvider(): Provider {
  return {
    provide: ANALYTICS_CLIENT,
    useFactory: (options: AnalyticsConfig) => {
      return mixpanel.init(options.mixpanelToken, options.config);
    },
    inject: [ANALYTICS_MODULE_OPTIONS],
  };
}
