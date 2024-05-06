import { createComplexityLimitRule } from 'graphql-validation-complexity'
import { ApolloServer, BaseContext } from '@apollo/server'
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled'
import fastifyApollo, {
	ApolloFastifyContextFunction,
	fastifyApolloDrainPlugin,
} from '@as-integrations/fastify'
import depthLimit from 'graphql-depth-limit'
import { ServerWithTypes } from '../server'
import { isDevelopment } from '../config'
import { prisma } from '../utils/prisma'
import schema from './schema'

export default async (app: ServerWithTypes) => {
	const apollo = new ApolloServer<GraphQLContext>({
		typeDefs: schema,
		introspection: isDevelopment,
		validationRules: [
			depthLimit(10),
			createComplexityLimitRule(1000, {
				scalarCost: 1,
				objectCost: 10, // Default is 0.
				listFactor: 20, // Default is 10.
				introspectionListFactor: 1,
			}),
		],
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
		plugins: [
			fastifyApolloDrainPlugin(app),
			...(!isDevelopment ? [ApolloServerPluginLandingPageDisabled()] : []),
		],
	})

	await apollo.start()

	interface GraphQLContext {
		prisma: typeof prisma
		organization: {
			id: number
			key: string
			name: string
		}
	}
	const myContextFunction: ApolloFastifyContextFunction<
		GraphQLContext
	> = async (request, reply) => {
		await app.verifyOrgAccess(request, reply)
		if (!request.organization) {
			throw new Error('Organization not found')
		}

		return { prisma, organization: request.organization }
	}
	await app.register(fastifyApollo(apollo), {
		context: myContextFunction,
		path: '/',
	})

	app.log.info('"GraphQL" service initialized')
}
