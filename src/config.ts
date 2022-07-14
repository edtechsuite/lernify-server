export const isProduction = process.env.NODE_ENV === 'production'
export const PORT = process.env.PORT || '4000'
export const dbConnectionString =
	process.env.DATABASE_URL || 'postgres://postgres@localhost/postgres'
const oneDayInMs = 1000 * 60 * 60 * 24
export const inviteTokenExpiration = parseInt(
	process.env.INVITE_TOKEN_EXPIRATION || oneDayInMs.toString(),
	10
)
