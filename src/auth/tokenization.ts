import Tokenize from '@cyyynthia/tokenize'
import { apiTokenString } from '../config'
import { prisma } from '../utils/prisma'

const tokenize = new Tokenize<ProfileAndOrg>(apiTokenString)

export function generateToken(str: string) {
	return tokenize.generate(str)
}

export function validateToken(token: string) {
	return tokenize.validate(token, async (id, prefix) => {
		return await getProfileFromToken(id)
	})
}

export function getLastTokenReset(date: Date) {
	return date.getTime()
}

async function getProfileFromToken(id: string) {
	const tokenData = await prisma.api_tokens.findUnique({
		where: { id },
		include: { user: true, organization: true },
	})

	if (!tokenData) {
		return null
	}
	return {
		user: tokenData.user,
		organization: tokenData.organization,
		lastTokenReset: getLastTokenReset(tokenData.lastReset),
	}
}

type ProfileAndOrg = ReturnType<typeof getProfileFromToken>
