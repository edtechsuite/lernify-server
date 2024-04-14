import Tokenize, { AsyncAccountFetcher } from '@cyyynthia/tokenize'
import { UserPrisma } from '../users/types'
import { apiTokenString } from '../config'

const tokenize = new Tokenize<UserPrisma & { lastTokenReset: number }>(
	apiTokenString
)

export function generateToken(str: string) {
	return tokenize.generate(str)
}

export function validateToken(
	token: string,
	callback: AsyncAccountFetcher<UserPrisma & { lastTokenReset: number }>
) {
	return tokenize.validate(token, callback)
}

export function getLastTokenReset(date: Date) {
	return date.getTime()
}
