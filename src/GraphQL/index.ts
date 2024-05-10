import path from 'path'
import mercurius from 'mercurius'
import { codegenMercurius, gql } from 'mercurius-codegen'
import { ServerWithTypes } from '../server'
import schema from './schema'
import { prisma } from '../utils/prisma'

export default async (app: ServerWithTypes) => {
	// Add authentication to GraphQL requests
	app.addHook('onRoute', (routeOptions) => {
		if (routeOptions.url === '/graphql' && routeOptions.method === 'POST') {
			routeOptions.preValidation = [app.verifyOrgAccess]
		}
	})

	app.register(mercurius, {
		schema,
		resolvers: {
			Query: {
				async activities(_parent, args, ctx) {
					return await ctx.prisma.activities.findMany({
						where: {
							deleted: false,
							organizationId: ctx.organization.id,
						},
					})
				},
			},
			Activity: {
				updatedByUser: async (parent, _args, ctx) => {
					// TODO: should we see a user if he isn't in the organization anymore?
					// TODO: should we see a user if he is a superadmin?
					return await ctx.prisma.users.findUnique({
						where: {
							id: parent.updatedBy,
						},
					})
				},
				performer: async (parent, _args, ctx) => {
					if (!parent.performerId) {
						return null
					}
					return await ctx.prisma.users.findUnique({
						where: {
							id: parent.performerId,
						},
					})
				},
				organization: async (parent, _args, ctx) => {
					const org = await ctx.prisma.organizations.findUnique({
						where: {
							id: parent.organizationId,
						},
					})
					if (!org) {
						throw new Error('Organization not found')
					}
					return org
				},
				participants: async (parent, _args, ctx) => {
					return await ctx.prisma.students.findMany({
						where: {
							studentsToActivities: {
								some: {
									activityId: parent.id,
									endDate: null,
								},
							},
						},
					})
				},
			},
			User: {
				performingActivities: async (parent, _args, ctx) => {
					return await ctx.prisma.activities.findMany({
						where: {
							performerId: parent.id,
							organizationId: ctx.organization.id,
						},
					})
				},
			},
		},
		context: (request, reply) => {
			return { prisma, organization: request.organization }
		},
		graphiql: true,
	})

	const pathToTypes = path.resolve(__dirname, './generated.d.ts')
	codegenMercurius(app, {
		targetPath: pathToTypes,
	}).catch(console.error)

	app.log.info('"GraphQL" service initialized')
}

declare module 'mercurius' {
	interface MercuriusContext {
		prisma: typeof prisma
		organization: {
			id: number
			key: string
			name: string
		}
	}
}
