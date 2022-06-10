exports.getCommonColumns = function (pgm) {
	return {
		createdAt: {
			type: 'timestamp',
			notNull: true,
			default: pgm.func('current_timestamp'),
		},
		updatedAt: {
			type: 'timestamp',
			notNull: true,
			default: pgm.func('current_timestamp'),
		},
		updatedBy: {
			type: 'integer',
			notNull: true,
			references: 'users(id)',
		},
	}
}
