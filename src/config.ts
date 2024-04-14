const oneDayInMs = 1000 * 60 * 60 * 24
const config = getConfig()

export const isProduction = config.isProduction
export const PORT = config.PORT
export const dbConnectionString = config.dbConnectionString
export const inviteTokenExpiration = config.inviteTokenExpiration
export const environment = process.env.NODE_ENV || 'production'
export const prismaDebug = config.prismaDebug
export const apiTokenString = process.env.API_TOKEN_STRING ?? ''

if (!apiTokenString || apiTokenString.length === 0) {
	// We can't start the server without the API token string
	throw new Error('API_TOKEN_STRING is not set')
}

export function getConfig() {
	return {
		isProduction: process.env.NODE_ENV !== 'development',
		PORT: parseInt(process.env.PORT || '4000', 10),
		dbConnectionString:
			process.env.DATABASE_URL || 'postgres://postgres@localhost/postgres',
		inviteTokenExpiration: parseInt(
			process.env.INVITE_TOKEN_EXPIRATION || oneDayInMs.toString(),
			10
		),
		disableDatabaseSecureConnection:
			process.env.DISABLE_DATABASE_SECURE_CONNECTION === 'true',
		prismaDebug: process.env.PRISMA_DEBUG === 'true',
	}
}
