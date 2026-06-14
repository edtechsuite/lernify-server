export type Filter =
	| TagFilter
	| NameFilter
	| GroupsFilter
	| OrganizationUnitFilter
export type TagFilter = {
	field: 'tags'
	value: string[]
	operation: 'contains'
}
export type GroupsFilter = {
	field: 'group'
	value: number[]
	operation: 'is'
}
export type NameFilter = {
	field: 'name'
	value: string
	operation: 'contains' | 'startsWith' | 'endsWith'
}
export type OrganizationUnitFilter = {
	field: 'organizationUnit'
	/** IDs of organizational units to scope. Includes descendants when built by the service layer. */
	value: string[]
	operation: 'is'
}
export type PaginationConfig = {
	// order: 'asc' | 'desc'
	// orderBy: string
	page: number
	pageSize: number
}
