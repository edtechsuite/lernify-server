import { FastifyInstance } from 'fastify'
import fastifyPostgres from '@fastify/postgres'
import fastifyPlugin from 'fastify-plugin'
import { getConfig } from './config'

export async function databaseConnector(
	app: FastifyInstance,
	options: {
		connectionString: string
	}
) {
	const { disableDatabaseSecureConnection } = getConfig()
	app.register(fastifyPostgres, {
		connectionString: options.connectionString,
		...(disableDatabaseSecureConnection
			? {}
			: {
					ssl: {
						rejectUnauthorized: false,
					},
			  }),
	})
}

export default fastifyPlugin(databaseConnector)
