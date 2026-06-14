/* eslint-disable camelcase */

exports.shorthands = undefined

const ancestryTable = 'organizationUnitAncestry'

exports.up = (pgm) => {
	pgm.createTable(ancestryTable, {
		ancestorId: {
			type: 'uuid',
			notNull: true,
			references: '"organizationUnit"(id)',
			onDelete: 'CASCADE',
		},
		descendantId: {
			type: 'uuid',
			notNull: true,
			references: '"organizationUnit"(id)',
			onDelete: 'CASCADE',
		},
		depth: {
			type: 'integer',
			notNull: true,
		},
	})

	pgm.addConstraint(
		ancestryTable,
		'pk_org_unit_ancestry',
		'PRIMARY KEY ("ancestorId", "descendantId")',
	)
	pgm.createIndex(ancestryTable, ['descendantId', 'depth'])
	pgm.createIndex(ancestryTable, ['ancestorId', 'depth'])
}

exports.down = (pgm) => {
	pgm.dropTable(ancestryTable)
}
