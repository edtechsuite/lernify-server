const oneDayInMs = 1000 * 60 * 60 * 24
const config = getConfig()

export const isProduction = config.isProduction
export const PORT = config.PORT
export const dbConnectionString = config.dbConnectionString
export const inviteTokenExpiration = config.inviteTokenExpiration
export const environment = process.env.NODE_ENV || 'production'

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
	}
}
