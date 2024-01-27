import { Filter, PaginationConfig } from './types'
import { getReportRecords } from './getReportRecords'

export async function reportPreview(
	orgId: number,
	filters: Filter[],
	range: { from: Date; to: Date },
	config: PaginationConfig
) {
	return await getReportRecords(orgId, filters, range, config)
}
