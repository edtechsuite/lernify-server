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
	async assignment({ email, ...data }: AssignmentMessageData) {
		// TODO: we have other activities, so we need to make `group` dynamic
		const text = data.isAssign
			? 'You have been assigned to a group'
			: 'You have been unassigned from a group'
		await this.messenger.send(
			process.env.DEFAULT_MAIL_SENDER ?? '',
			email,
			`Group Assignment has been changed`,
			templates.assignment({
				action: {
					link: data.link,
					label: 'View',
				},
				content: text,
				preheaderContent: text,
				title: 'Group Assignment has been changed',
			})
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
	assignment: (data: AssignmentTplData) => {
		const layout = getTemplateByName('layout')
		const actionBtnTpl = getTemplateByName('actionBtn')
		const actionBtn = template(actionBtnTpl)(data.action)
		return template(layout)({
			...data,
			actions: actionBtn,
		})
	},
}

function getTemplateByName(name: string) {
	return readFileSync(path.resolve(__dirname, `templates/${name}.htm`), 'utf8')
}
type InviteTplData = {
	link: string
	orgName: string
	userName: string
}
type AssignmentTplData = {
	title: string
	preheaderContent: string
	content: string
	action: {
		link: string
		label: string
	}
}
type InviteMessageData = InviteTplData & {
	email: string
}

type AssignmentMessageData = {
	isAssign: boolean
	email: string
	link: string
}
