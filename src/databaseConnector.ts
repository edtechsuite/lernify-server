import { FastifyInstance } from 'fastify'
import fastifyPostgres from '@fastify/postgres'
import fastifyPlugin from 'fastify-plugin'
import { dbConnectionString } from './config'

export async function databaseConnector(app: FastifyInstance) {
	app.register(fastifyPostgres, {
		connectionString: dbConnectionString,
		ssl: {
			rejectUnauthorized: false,
		},
	})
}

export default fastifyPlugin(databaseConnector)
