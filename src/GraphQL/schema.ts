import { gql } from 'mercurius-codegen'

export default gql`
	type Query {
		activities: [Activity!]
	}

	type Activity {
		id: Int!
		name: String!
	}
`
