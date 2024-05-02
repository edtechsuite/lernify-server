import { FastifyInstance } from 'fastify'

export async function initiateOpenApi(app: FastifyInstance) {
	await app.register(require('@fastify/swagger'), {
		openapi: {
			openapi: '3.0.0',
			info: {
				title: 'Checkinizer B2B API',
			},
			servers: [
				{
					url: 'http://localhost:4000',
					description: 'Development server',
				},
				{
					url: 'https://app.checkinizer.com',
					description: 'Production server',
				},
			],
			tags: [
				{
					name: 'participants',
					description: 'Participants, students, visitors etc.',
				},
			],
			components: {
				securitySchemes: {
					apiKey: {
						type: 'apiKey',
						name: 'authorization',
						in: 'header',
					},
				},
			},
		},
	})

	await app.register(require('@fastify/swagger-ui'), {
		routePrefix: '/docs',
		uiConfig: {
			docExpansion: 'full',
			deepLinking: true,
		},
		staticCSP: true,
		transformSpecificationClone: true,
	})
}
