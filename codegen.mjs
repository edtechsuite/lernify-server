const config = {
	overwrite: true,
	schema: './src/GraphQL/schema.graphql',
	generates: {
		'src/GraphQL/generatedTypes.ts': {
			config: {
				defaultMapper: 'Partial<{T}>',
			},
			plugins: ['typescript', 'typescript-resolvers'],
		},
	},
}

export default config
