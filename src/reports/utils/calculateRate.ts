export function calculateRate(
	attendancesMap: Map<string, Map<string, boolean[]>>,
	activities: Activity[],
	participant: Participant[]
): ReportRecord[] {
	const activitiesMap = activities.reduce<{ [outerId: string]: Activity }>(
		(acc, activity) => {
			acc[activity.outerId] = activity
			return acc
		},
		{}
	)
	const participantsMap = participant.reduce<{
		[outerId: string]: Participant
	}>((acc, participant) => {
		acc[participant.outerId] = participant
		return acc
	}, {})
	const result: ReportRecord[] = []
	const entries = [...attendancesMap.entries()]
	entries.forEach(([activityOuterId, activity]) => {
		;[...activity.entries()].forEach(([studentOuterId, attended]) => {
			const precision = 10000
			const rate =
				Math.round(
					(attended.filter(Boolean).length / attended.length) * precision
				) / precision
			if (!participantsMap[studentOuterId]) {
				return
			}
			result.push({
				activityId: activitiesMap[activityOuterId].id,
				activityName: activitiesMap[activityOuterId].name,
				activityOuterId,
				participantId: participantsMap[studentOuterId].id,
				participantName: participantsMap[studentOuterId].name,
				rate,
				attended: attended.filter(Boolean).length,
				total: attended.length,
			})
		})
	})

	return result
}

type Activity = {
	id: number
	outerId: string
	name: string
}

export type Participant = {
	id: number
	outerId: string
	name: string
}

type ReportRecord = {
	participantId: number
	participantName: string
	activityId: number
	activityName: string
	activityOuterId: string
	rate: number
	attended: number
	total: number
}
