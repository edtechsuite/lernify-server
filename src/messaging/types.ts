export interface Messenger {
	send(from: string, to: string, subject: string, html: string): Promise<void>
}

export interface Emailer {
	register(email: string): Promise<void>
	invite(data: InviteData): Promise<void>
}

type InviteData = {
	email: string
	link: string
	orgName: string
	userName: string
}