import fastifyPostgres from '@fastify/postgres'
import { FastifyInstance } from 'fastify'
import { dbConnectionString } from './config'

export function initDatabase(app: FastifyInstance) {
	app.register(fastifyPostgres, {
		connectionString: dbConnectionString,
		ssl: {
			rejectUnauthorized: false,
		},
	})
}
