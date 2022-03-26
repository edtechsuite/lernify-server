import fastify from 'fastify'
import mercurius, { IResolvers } from 'mercurius'
import mercuriusAuth from 'mercurius-auth'
import mercuriusCodegen, { gql } from 'mercurius-codegen'

const app = fastify()


const schema = gql`
  directive @auth(
    requires: Role = ADMIN,
  ) on OBJECT | FIELD_DEFINITION

  enum Role {
    ADMIN
    REVIEWER
    USER
    UNKNOWN
  }

  type Query {
    add(x: Int, y: Int): Int @auth(requires: USER)
  }
`

const resolvers: IResolvers = {
    Query: {
    add: async (_, { x, y }) => (x && y) ? x + y : 0
    }
}

app.register(mercurius, {
    schema,
  resolvers,
})

app.register(mercuriusAuth, {
    authContext(context) {
        return {
            identity: context.reply.request.headers['x-user']
        }
    },
    async applyPolicy(authDirectiveAST, parent, args, context, info) {
      return context.auth?.identity === 'admin'
    },
    authDirective: 'auth'
})

mercuriusCodegen(app, {
  // Commonly relative to your root package.json
  targetPath: './src/graphql/generated.ts'
}).catch(console.error)

app.get('/', async function (req, reply) {
    const query = '{ add(x: 2, y: 2) }'
    return reply.graphql(query)
})

app.listen(3000)
