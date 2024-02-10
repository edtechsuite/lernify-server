export class BaseEvent {
	public data: unknown
	constructor(
		public type: string,
		public date: Date,
		public parserVersion: string,
		public subject?: number,
		public object?: number
	) {}

	public toJson() {
		return {
			type: this.type,
			date: this.date,
			parserVersion: this.parserVersion,
			subject: this.subject,
			object: this.object,
			data: this.data,
		}
	}
}
