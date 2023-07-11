import { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'

export const prisma = new PrismaClient()

export function isUniqueConstraintFailedError(
	error: any
): error is Prisma.PrismaClientKnownRequestError {
	return (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === 'P2002'
	)
}
