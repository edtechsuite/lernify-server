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
						},
					})
				},
			},
		},
		context: (request, reply) => {
			return { prisma }
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
	}
}
