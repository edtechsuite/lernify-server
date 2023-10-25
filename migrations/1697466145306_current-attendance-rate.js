/* eslint-disable camelcase */

exports.shorthands = undefined

const tableName = 'studentsToActivities'
exports.up = (pgm) => {
	pgm.addColumns(tableName, {
		currentAttendanceRate: {
			type: 'real',
			notNull: true,
			default: 0,
		},
		eventsNumber: { type: 'smallint', notNull: true, default: 0 },
	})
}

exports.down = (pgm) => {
	pgm.dropColumns(tableName, ['currentAttendanceRate', 'eventsNumber'])
}
