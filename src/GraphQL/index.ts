import path from 'path'
import mercurius from 'mercurius'
import { codegenMercurius, gql } from 'mercurius-codegen'
import { ServerWithTypes } from '../server'

export default async (app: ServerWithTypes) => {
	app.register(mercurius, {
		schema: gql`
			type Query {
				hello(greetings: String!): String!
			}
		`,
		resolvers: {
			Query: {
				hello(_root, { greetings }) {
					// greetings ~ string
					return 'Hello World'
				},
			},
		},
		graphiql: true,
	})

	const pathToTypes = path.resolve(__dirname, './generated.d.ts')
	codegenMercurius(app, {
		targetPath: pathToTypes,
	}).catch(console.error)

	app.log.info('"GraphQL" service initialized')
}
