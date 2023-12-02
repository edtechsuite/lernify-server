/* eslint-disable camelcase */

exports.shorthands = undefined

const tableName = 'studentsToActivities'
exports.up = (pgm) => {
	pgm.addColumns(tableName, {
		leaveReasonComment: { type: 'varchar(1000)' },
	})
}

exports.down = (pgm) => {
	pgm.dropColumns(tableName, ['leaveReasonComment'])
}
