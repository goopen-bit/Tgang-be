import { Inject } from '@nestjs/common';
import { ANALYTICS_CLIENT } from './analytics.constants';

export const InjectMixpanel = () => Inject(ANALYTICS_CLIENT);
