import { readFileSync } from 'fs'
import path from 'path'
import template from 'lodash.template'
import { Emailer, Messenger } from '../types'
import { ResendMessenger } from '../messenger'

export class Mailer implements Emailer {
	private messenger: Messenger
	constructor() {
		this.messenger = new ResendMessenger()
	}

	async register(email: string) {
		await this.messenger.send(
			process.env.DEFAULT_MAIL_SENDER ?? '',
			email,
			`Welcome to ${process.env.APP_NAME}`,
			templates.register()
		)
	}
	async invite({ email, ...data }: InviteMessageData) {
		await this.messenger.send(
			process.env.DEFAULT_MAIL_SENDER ?? '',
			email,
			`You've been invited to ${process.env.APP_NAME}`,
			templates.invite(data)
		)
	}
}

// TODO: it would be great if we can translate these templates
const templates = {
	register: () =>
		readFileSync(path.resolve(__dirname, 'templates/register.htm'), 'utf8'),
	invite: (data: InviteTplData) =>
		template(
			readFileSync(path.resolve(__dirname, 'templates/invite.htm'), 'utf8')
		)(data),
}

type InviteTplData = {
	link: string
	orgName: string
	userName: string
}
type InviteMessageData = InviteTplData & {
	email: string
}
