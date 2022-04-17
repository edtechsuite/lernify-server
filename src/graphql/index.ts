import { FastifyInstance } from 'fastify'
import mercurius, { IResolvers } from 'mercurius'
import mercuriusCodegen, { gql } from 'mercurius-codegen'
import mercuriusAuth from 'mercurius-auth'
import { getAuth } from 'firebase-admin/auth'
import { getUserProfile } from '../auth'
import { createLogger } from '../logger'

export function initGraphQLInterface(app: FastifyInstance) {
	const graphQlLogger = createLogger('GraphQL')
	const authLogger = createLogger('Auth')
	const schema = gql`
		directive @auth(requires: Role) on OBJECT | FIELD_DEFINITION

		enum Role {
			SUPER_ADMIN
			ORGANIZATION_ADMIN
			ORGANIZATION_USER
		}

		type Query {
			profile: Profile! @auth
		}

		type Profile {
			id: String!
			name: String!
			email: String!
		}
	`

	const resolvers: IResolvers = {
		Query: {
			async profile(root, args, ctx, info) {
				try {
					return await getUserProfile(ctx.auth?.identity.uid)
					// TODO: fix any
				} catch (error: any) {
					authLogger.error(error.message)
					throw error
				}
			},
		},
	}

	app.register(mercurius, {
		schema,
		resolvers,
		graphiql: 'graphiql',
	})

	app.register(mercuriusAuth, {
		async authContext(context) {
			const auth = getAuth()
			const token = context.reply.request.headers['authorization']
			// const referer = context.reply.request.headers['referer']
			// console.log('=-= referer', referer)

			if (!token) {
				return {
					identity: null,
				}
			}

			const decodedToken = await auth.verifyIdToken(
				Array.isArray(token) ? token[0] : token
			)
			const user = await getUserProfile(decodedToken.uid)

			return {
				identity: { ...decodedToken, role: user.role },
			}
		},
		async applyPolicy(authDirectiveAST, parent, args, context, info) {
			const findArg = (arg: string, ast: any) => {
				let result
				ast.arguments.forEach((a: any) => {
					if (a.kind === 'Argument' && a.name.value === arg) {
						result = a.value.value
					}
				})
				return result
			}
			const requires = findArg('requires', authDirectiveAST)
			if (!context.auth?.identity) {
				return false
			}

			if (context.auth.identity.role !== requires) {
				throw new Error(
					`User with role "${context.auth.identity.role}" doesn't have access to this resource`
				)
			}

			return true
		},
		authDirective: 'auth',
	})

	mercuriusCodegen(app, {
		// Commonly relative to your root package.json
		targetPath: './src/graphql/generated.ts',
	}).catch((error: Error) => {
		graphQlLogger.error(error.message)
	})
}
