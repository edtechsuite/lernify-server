import winston, { format, transports } from 'winston'

export function createLogger(serviceName: string) {
	const formatter = format.combine(
		format.colorize(),
		format.timestamp(),
		format.align(),
		format.printf(
			(info) =>
				`${info.timestamp} ${info.level} [${info.service}]: ${info.message}`
		)
	)
	const logger = winston.createLogger({
		level: 'info',
		defaultMeta: { service: serviceName },
		format: format.combine(format.timestamp(), format.json()),
		transports: [
			new winston.transports.Console({
				format: formatter,
			}),
		],
		exceptionHandlers: [new transports.Console({ format: formatter })],
		rejectionHandlers: [new transports.Console({ format: formatter })],
	})

	return logger
}
