import { Type } from '@fastify/type-provider-typebox'

export const paginationSchemaPart = {
	page: Type.Optional(Type.Number()),
	pageSize: Type.Optional(
		Type.Number({
			minimum: 1,
			maximum: 100,
			default: 10,
		})
	),
}
