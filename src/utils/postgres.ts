import { FastifyInstance } from 'fastify'

export async function testConnection(app: FastifyInstance) {
	const client = await app.pg.connect()
	client.release()
}
