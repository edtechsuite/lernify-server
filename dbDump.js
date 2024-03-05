require('dotenv/config')
const { exec } = require('child_process')
const path = require('path')
const { promisify } = require('util')

const execAsync = promisify(exec)

const dbConnectionString = process.argv[2]
if (!dbConnectionString || dbConnectionString.length === 0) {
	throw new Error('Database connection string is required.')
}
const pgExecutables = process.env.PG_EXECUTABLES
const postfix = `${
	new Date().toISOString().split('T')[0]
}-${new Date().getTime()}`
const dumpPath = path.resolve(__dirname, `./backup/dump-${postfix}.sql`)
const dump = async () => {
	const str = `"${pgExecutables}/pg_dump" --clean ${dbConnectionString} > ${dumpPath}`

	try {
		console.log(`Dumping database to "${dumpPath}"...`)

		const { stdout, stderr } = await execAsync(str)
		if (stderr) {
			throw new Error(stderr)
		}
		console.log(stdout)

		console.log(`Done dumping database to "${dumpPath}".`)
	} catch (error) {
		console.error('Error dumping database.')
		console.error(error)
	}
}

dump()
