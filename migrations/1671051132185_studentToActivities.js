/* eslint-disable camelcase */
const { getCommonColumns } = require('./utils/commonColumns')

exports.shorthands = undefined

const tableName = 'studentsToActivities'
exports.up = (pgm) => {
	pgm.createTable(tableName, {
		id: 'id',
		activityId: {
			type: 'integer',
			references: 'activities(id)',
		},
		participantId: {
			type: 'integer',
			references: 'students(id)',
		},
		startDate: {
			type: 'timestamp',
			notNull: true,
			default: pgm.func('current_timestamp'),
		},
		endDate: {
			type: 'timestamp',
			default: pgm.func('current_timestamp'),
		},
		...getCommonColumns(pgm),
	})
}

exports.down = (pgm) => {
	pgm.dropTable(tableName)
}
