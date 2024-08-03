import { DynamicModule, Module } from '@nestjs/common';
import { createAnalyticsProvider } from './analytics.provider';
import { ANALYTICS_CLIENT, ANALYTICS_MODULE_OPTIONS } from './analytics.constants';
import { AnalyticsConfig } from './analytics.interface';

@Module({
  providers: [createAnalyticsProvider()],
  exports: [ANALYTICS_CLIENT],
})
export class AnalyticsModule {
  static register(options: AnalyticsConfig): DynamicModule {
    return {
      module: AnalyticsModule,
      global: options.isGlobal,
      providers: [
        {
          provide: ANALYTICS_MODULE_OPTIONS,
          useValue: options,
        },
      ],
    };
  }
}
