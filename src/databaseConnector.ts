import { FastifyInstance } from 'fastify'
import fastifyPostgres from '@fastify/postgres'
import fastifyPlugin from 'fastify-plugin'

export async function databaseConnector(
	app: FastifyInstance,
	options: {
		connectionString: string
	}
) {
	app.register(fastifyPostgres, {
		connectionString: options.connectionString,
		ssl: {
			rejectUnauthorized: false,
		},
	})
}

export default fastifyPlugin(databaseConnector)
