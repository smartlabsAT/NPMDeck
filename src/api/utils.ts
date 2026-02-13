/**
 * Build expand query params from an array of relation names.
 * Returns undefined when there are no expand fields so axios omits the param.
 */
export const buildExpandParams = (expand?: string[]): { expand: string } | undefined =>
  expand?.length ? { expand: expand.join(',') } : undefined
