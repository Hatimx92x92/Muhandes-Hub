import { z } from 'zod/v4';

export const AnalyticsPeriod = z.enum(['7d', '30d', '90d', '12m', 'all']).default('30d');

export const GetAnalyticsSchema = z.object({
  period: AnalyticsPeriod,
});

export type GetAnalyticsInput = z.infer<typeof GetAnalyticsSchema>;
