import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
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
