import { OrganizationRecord } from '../../organizations/types'
import { getAttendances } from '../../firebase/attendances'
import { getAttendanceMap } from '../utils/getAttendanceMap'
import { calculateRate2 } from '../utils/calculateRate'
import { Filter, PaginationConfig } from './types'
import { getReportRecords } from './getReportRecords'

export async function reportByFilter(
	organization: OrganizationRecord,
	filters: Filter[],
	range: Range,
	pagination?: PaginationConfig
) {
	const records = await getReportRecords(
		organization.id,
		filters,
		range,
		pagination
	)
	const attendances = await getAttendances(organization.key, range)
	const [attendanceMap] = getAttendanceMap(attendances)

	return {
		data: calculateRate2(records.data, attendanceMap),
		total: records.total,
	}
}

type Range = { from: Date; to: Date }
