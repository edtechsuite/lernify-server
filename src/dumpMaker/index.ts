import { getDownloadURL, getStorage } from 'firebase-admin/storage'
import { FastifyInstance } from 'fastify'
import path from 'path'
import util from 'util'
const exec = util.promisify(require('child_process').exec)

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
			const res = await makePgDump()
			return `dump download path: \n${res}`
		}
	)
}

async function makePgDump() {
	const postfix = `${
		new Date().toISOString().split('T')[0]
	}-${new Date().getTime()}`
	const pgExecutables = process.env.PG_EXECUTABLES
	const dumpPath = path.resolve(__dirname, `../../backup/dump-${postfix}.sql`)
	const str = `"${pgExecutables}/pg_dump" --clean ${process.env.DATABASE_URL} > ${dumpPath}`

	await runCommand(str)

	return await upload(dumpPath, `dump-${postfix}.sql`)
}

async function runCommand(command: string) {
	const { stdout, stderr } = await exec(command)
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
