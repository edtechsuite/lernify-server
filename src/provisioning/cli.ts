// Reading `.env` file
import 'dotenv/config'
import prompts from 'prompts'
import { Client } from 'pg'

const dbConnectionString =
	process.env.DATABASE_URL || 'postgres://postgres@localhost/postgres'

;(async () => {
	const response = await prompts({
		type: 'select',
		name: 'value',
		message: 'Pick a provisioning scenario',
		choices: [
			{
				title: 'Initial',
				description: 'an initial provisioning to start working',
				value: 'initial',
			},
			{ title: 'Exit', value: null },
		],
		initial: 0,
	})

	if (response.value === 'initial') {
		console.log('Initial provisioning in progress...')
		const client = new Client(dbConnectionString)
		await client.connect()
		const res = await client.query('INSERT INTO users ( name ) VALUES ( $1 )', [
			'John Doe',
		])
		await client.end()
		console.log('=-= res', res)
	}
})()
