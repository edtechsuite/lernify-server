import { FastifyInstance } from 'fastify'
import mercurius, { IResolvers } from 'mercurius'
import mercuriusCodegen, { gql } from 'mercurius-codegen'
import { getUserProfile } from '../auth'
import { createLogger } from '../logger'

export function initGraphQLInterface(app: FastifyInstance) {
	const logger = createLogger('GraphQL')
	const schema = gql`
		type Query {
			profile(token: String!): Profile!
		}

		type Profile {
			id: String!
			name: String!
			email: String!
		}
	`

	const resolvers: IResolvers = {
		Query: {
			async profile(root, { token }, ctx, info) {
				return await getUserProfile(token)
			},
		},
	}

	app.register(mercurius, {
		schema,
		resolvers,
		graphiql: 'graphiql',
	})

	mercuriusCodegen(app, {
		// Commonly relative to your root package.json
		targetPath: './src/graphql/generated.ts',
	}).catch((error: Error) => {
		logger.error(error.message)
	})
}
