import { getDownloadURL, getStorage } from 'firebase-admin/storage'
import { FastifyInstance } from 'fastify'
import path from 'path'
import util from 'util'
const execFile = util.promisify(require('child_process').execFile)

export function dumpMaker(app: FastifyInstance, opts: any, done: () => void) {
	initDumpHandlers(app)

	app.log.info('"dump" service initialized')

	done()
}

function initDumpHandlers(app: any) {
	app.post(
		'/',
		{
			preHandler: [app.ensureUserIsSystemAdmin],
		},
		async () => {
			return await makePgDump()
		},
	)
}

async function makePgDump() {
	const postfix = `${
		new Date().toISOString().split('T')[0]
	}-${new Date().getTime()}`
	const pgExecutables = process.env.PG_EXECUTABLES
	const dumpPath = path.resolve(__dirname, `../../backup/dump-${postfix}.sql`)
	const pgDumpExe = pgExecutables ? `${pgExecutables}/pg_dump` : 'pg_dump'
	await runCommand(pgDumpExe, [
		'--clean',
		'--file',
		dumpPath,
		process.env.DATABASE_URL || '',
	])

	return await upload(dumpPath, `dump-${postfix}.sql`)
}

async function runCommand(command: string, args: string[]) {
	const { stdout, stderr } = await execFile(command, args)
	if (stderr) {
		throw new Error(stderr)
	}
	return stdout
}

async function upload(filePath: string, destName: string) {
	const bucketName = process.env.BACKUP_BUCKET_NAME
	const bucket = getStorage().bucket(bucketName)
	await bucket.upload(filePath, {
		destination: destName,
	})

	const fileRef = bucket.file(destName)
	return await getDownloadURL(fileRef)
}
