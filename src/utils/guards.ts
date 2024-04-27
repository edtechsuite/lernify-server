export function isNotUndefined<T>(value: T | undefined): value is T {
	return value !== undefined
}
export function isNotNull<T>(value: T | null): value is T {
	return value !== null
}
