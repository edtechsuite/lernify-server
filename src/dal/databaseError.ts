import { DatabaseError } from 'pg'

export function isDatabaseError(error: any): error is DatabaseError {
	return error instanceof DatabaseError
}
