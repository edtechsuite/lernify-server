import { FastifyInstance } from 'fastify'
import { getUserProfile } from '../firebase'

export async function syncProfile(
	app: FastifyInstance,
	email: string | undefined,
	uid: string
) {
	const name = (await getFireBaseUsername(uid)) || email || ''
	const client = await app.pg.connect()
	try {
		const result = await client.query(
			'INSERT INTO users ( name, email, "outerId" ) VALUES ( $1, $2, $3 ) returning id, name, email',
			[name, email, uid]
		)

		return result.rows[0]
	} catch (error) {
		throw error
	} finally {
		client.release()
	}
}

async function getFireBaseUsername(uid: string) {
	try {
		const fbUserProfile = await getUserProfile(uid)
		return fbUserProfile.name
	} catch (error) {
		// Can't get the user profile from firebase.
		return null
	}
}
