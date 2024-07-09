import { v4 } from 'uuid'
import { Type } from '@fastify/type-provider-typebox'
import { prisma } from '../utils/prisma'
import { ServerWithTypes } from '../server'

export function initHandlers(app: ServerWithTypes) {
	app.addHook(
		'preHandler',
		app.auth([app.verifyOrgAccess, app.ensureUserIsSystemAdmin], {
			relation: 'or',
		})
	)

	app.post(
		'/',
		{
			schema: {
				body: Type.Object({
					name: Type.String(),
					parentId: Type.Optional(Type.String()),
				}),
			},
		},
		async (req, reply) => {
			return prisma.organizationUnit.create({
				data: {
					id: v4(),
					name: req.body.name,
					organizationId: req.organization!.id,
					parentId: req.body.parentId,
				},
			})
		}
	)
	app.get(
		'/',
		{
			schema: {
				querystring: Type.Object({
					page: Type.Integer(),
					pageSize: Type.Integer(),
				}),
			},
		},
		async (req, reply) => {
			const { page, pageSize } = req.query
			const data = await prisma.organizationUnit.findMany({
				skip: page * pageSize,
				take: pageSize,
				where: {
					organizationId: req.organization!.id,
				},
				include: {
					parent: true,
				},
			})

			return {
				data: data,
				total: await prisma.organizationUnit.count({
					where: {
						organizationId: req.organization!.id,
					},
				}),
			}
		}
	)
	app.get(
		'/:id',
		{
			schema: {
				params: Type.Object({
					id: Type.String(),
				}),
			},
		},
		async (req, reply) => {
			return prisma.organizationUnit.findUnique({
				where: {
					id: req.params.id,
				},
				include: {
					units: true,
				},
			})
		}
	)
}
