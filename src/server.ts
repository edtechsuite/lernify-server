import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import fastify from 'fastify'
import { environment } from './config'

const envToLogger: Record<string, any> = {
	development: {
		transport: {
			target: 'pino-pretty',
			options: {
				translateTime: 'HH:MM:ss Z',
				ignore: 'pid,hostname',
			},
		},
	},
	production: true,
	test: false,
}

export const server = fastify({
	logger: envToLogger[environment],
}).withTypeProvider<TypeBoxTypeProvider>()

export type ServerWithTypes = typeof server
