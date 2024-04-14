import { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { prismaDebug } from '../config'

export const prisma = new PrismaClient({
	log: prismaDebug
		? [
				{
					emit: 'stdout',
					level: 'query',
				},
		  ]
		: [],
})

export function isUniqueConstraintFailedError(
	error: any
): error is Prisma.PrismaClientKnownRequestError {
	return (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === 'P2002'
	)
}
