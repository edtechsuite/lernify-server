export const isProduction = process.env.NODE_ENV === 'production'
export const PORT = process.env.PORT || '4000'
export const dbConnectionString =
	process.env.DATABASE_URL || 'postgres://postgres@localhost/postgres'
