import { Emailer, Messenger } from '../types'
import { ResendMessenger } from '../messenger'
import { readFileSync } from 'fs'
import path from 'path'

export class Mailer implements Emailer {
	private messenger: Messenger
	constructor() {
		this.messenger = new ResendMessenger()
	}

	async register(email: string) {
		await this.messenger.send(
			process.env.DEFAULT_MAIL_SENDER || '',
			email,
			`Welcome to ${process.env.APP_NAME}`,
			templates.register()
		)
	}
}

const templates = {
	register: () =>
		readFileSync(path.resolve(__dirname, 'templates/register.htm'), 'utf8'),
}
