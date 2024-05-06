import gql from 'graphql-tag'

export default gql`
	type Query {
		activities: [Activity!]
	}

	type Activity {
		id: Int!
		name: String!
		type: String!
		outerId: String!
		deleted: Boolean!
		createdAt: DateTime!
		updatedAt: DateTime!
		updatedBy: Int!
		updatedByUser: User
		archived: Boolean!
		organizationId: Int!
		organization: Organization!
		performerId: Int
		performer: User
		participants: [Participants!]!
	}

	type Organization {
		id: Int!
	}
	type User {
		id: Int!
		name: String!
		email: String!
		# outerId: String!
		# systemRole: String
		createdAt: DateTime!
		performingActivities: [Activity!]!
	}
	type Participants {
		id: Int!
	}

	scalar DateTime
`
