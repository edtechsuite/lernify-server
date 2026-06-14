import { Type } from '@fastify/type-provider-typebox'
import { ServerWithTypes } from '../server'
import {
	getOrgUnits,
	getOrgUnit,
	createOrgUnit,
	updateOrgUnit,
	archiveOrgUnit,
	reparentOrgUnit,
} from '../dal/organizationUnits'

const MAX_DEPTH = 10

export function initHandlers(app: ServerWithTypes) {
	app.addHook(
		'preHandler',
		app.auth([app.verifyOrgAccess, app.ensureUserIsSystemAdmin], {
			relation: 'or',
		})
	)

	// POST / - Create a new organizational unit
	app.post(
		'/',
		{
			schema: {
				body: Type.Object({
					name: Type.String(),
					parentId: Type.Optional(Type.String()),
					sortOrder: Type.Optional(Type.Integer()),
				}),
			},
		},
		async (req, reply) => {
			const orgId = req.organization!.id

			// Validate parent belongs to same org if provided
			if (req.body.parentId) {
				const parent = await getOrgUnit(req.body.parentId, orgId)
				if (!parent) {
					return reply.status(400).send({ error: 'Parent unit not found in organization' })
				}
				if (parent.archivedAt) {
					return reply.status(400).send({ error: 'Cannot create unit under an archived parent' })
				}
			}

			return createOrgUnit({
				name: req.body.name,
				organizationId: orgId,
				parentId: req.body.parentId,
				sortOrder: req.body.sortOrder,
			})
		}
	)

	// GET / - List all units for the organization
	app.get(
		'/',
		{
			schema: {
				querystring: Type.Object({
					includeArchived: Type.Optional(Type.Boolean({ default: false })),
				}),
			},
		},
		async (req) => {
			const orgId = req.organization!.id
			const { includeArchived } = req.query
			return getOrgUnits(orgId, includeArchived)
		}
	)

	// GET /tree - Return units as a nested tree structure
	app.get('/tree', async (req) => {
		const orgId = req.organization!.id
		const flat = await getOrgUnits(orgId, false)

		type TreeNode = (typeof flat)[number] & { children: TreeNode[] }
		const map = new Map<string, TreeNode>()
		flat.forEach((u) => map.set(u.id, { ...u, children: [] }))
		const roots: TreeNode[] = []
		map.forEach((node) => {
			if (node.parentId && map.has(node.parentId)) {
				map.get(node.parentId)!.children.push(node)
			} else {
				roots.push(node)
			}
		})
		return roots
	})

	// GET /:id - Get a single unit
	app.get(
		'/:id',
		{
			schema: {
				params: Type.Object({ id: Type.String() }),
			},
		},
		async (req, reply) => {
			const unit = await getOrgUnit(req.params.id, req.organization!.id)
			if (!unit) return reply.status(404).send({ error: 'Unit not found' })
			return unit
		}
	)

	// PUT /:id - Update unit name/sortOrder
	app.put(
		'/:id',
		{
			schema: {
				params: Type.Object({ id: Type.String() }),
				body: Type.Object({
					name: Type.Optional(Type.String()),
					sortOrder: Type.Optional(Type.Integer()),
				}),
			},
		},
		async (req, reply) => {
			const orgId = req.organization!.id
			const result = await updateOrgUnit(req.params.id, orgId, req.body)
			if (result.count === 0) return reply.status(404).send({ error: 'Unit not found' })
			return getOrgUnit(req.params.id, orgId)
		}
	)

	// POST /:id/move - Re-parent a unit with cycle + depth validation
	app.post(
		'/:id/move',
		{
			schema: {
				params: Type.Object({ id: Type.String() }),
				body: Type.Object({
					parentId: Type.Union([Type.String(), Type.Null()]),
				}),
			},
		},
		async (req, reply) => {
			const orgId = req.organization!.id
			const error = await reparentOrgUnit(
				req.params.id,
				orgId,
				req.body.parentId,
				MAX_DEPTH
			)
			if (error) return reply.status(400).send({ error })
			return getOrgUnit(req.params.id, orgId)
		}
	)

	// POST /:id/archive - Archive a unit (soft delete)
	app.post(
		'/:id/archive',
		{
			schema: {
				params: Type.Object({ id: Type.String() }),
			},
		},
		async (req, reply) => {
			const orgId = req.organization!.id
			const result = await archiveOrgUnit(req.params.id, orgId)
			if (result.count === 0) {
				return reply.status(404).send({ error: 'Unit not found or already archived' })
			}
			return { success: true }
		}
	)
}
