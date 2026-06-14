/* eslint-disable camelcase */

exports.shorthands = undefined

const tableName = 'unit2participant'

exports.up = (pgm) => {
	pgm.addColumn(tableName, {
		subjectType: {
			type: 'varchar(50)',
			notNull: true,
			default: 'student',
		},
		effectiveFrom: {
			type: 'timestamp',
			notNull: false,
		},
		effectiveTo: {
			type: 'timestamp',
			notNull: false,
		},
	})

	pgm.addConstraint(
		tableName,
		'chk_effective_dates',
		`CHECK ("effectiveTo" IS NULL OR "effectiveFrom" IS NULL OR "effectiveTo" > "effectiveFrom")`,
	)

	pgm.createIndex(
		tableName,
		['unitId', 'participantId', 'subjectType', 'effectiveTo'],
		{
			name: 'idx_unit2participant_active_membership',
			where: '"effectiveTo" IS NULL',
		},
	)
}

exports.down = (pgm) => {
	pgm.dropIndex(tableName, [], {
		name: 'idx_unit2participant_active_membership',
	})
	pgm.dropConstraint(tableName, 'chk_effective_dates')
	pgm.dropColumn(tableName, ['subjectType', 'effectiveFrom', 'effectiveTo'])
}
