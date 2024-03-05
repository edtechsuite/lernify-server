require('dotenv/config')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

const dbConnectionString = process.argv[2]
const dumpPath = process.argv[3]
if (!dbConnectionString || dbConnectionString.length === 0) {
	throw new Error('Database connection string is required.')
}
if (!dumpPath || dumpPath.length === 0) {
	throw new Error('Dump Path is required.')
}
const pgExecutables = process.env.PG_EXECUTABLES

async function restore() {
	const connectionStringChunks = dbConnectionString.split('/')
	const dbName = connectionStringChunks[connectionStringChunks.length - 1]

	console.log(`Restoring database from "${dumpPath}"...`)
	const str = `"${pgExecutables}/psql" ${dbConnectionString} < ${dumpPath}`
	await runCmd(str)
}

restore()

async function runCmd(str) {
	console.log('Running cmd:', str)
	try {
		const { stdout, stderr } = await execAsync(str)
		if (stderr) {
			throw new Error(stderr)
		}
		return stdout
	} catch (error) {
		console.error(`Error running cmd ${str}`)
		console.error(error)
		throw error
	}
}
