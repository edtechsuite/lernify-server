import type {
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
} from 'graphql'
import type { MercuriusContext } from 'mercurius'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K]
}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>
}
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>
}
export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) =>
  | Promise<import('mercurius-codegen').DeepPartial<TResult>>
  | import('mercurius-codegen').DeepPartial<TResult>
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  DateTime: any
  _FieldSet: any
}

export type Query = {
  __typename?: 'Query'
  activities?: Maybe<Array<Activity>>
}

export type Activity = {
  __typename?: 'Activity'
  id: Scalars['Int']
  name: Scalars['String']
  type: Scalars['String']
  outerId: Scalars['String']
  deleted: Scalars['Boolean']
  createdAt: Scalars['DateTime']
  updatedAt: Scalars['DateTime']
  updatedBy: Scalars['Int']
  updatedByUser?: Maybe<User>
  archived: Scalars['Boolean']
  organizationId: Scalars['Int']
  organization: Organization
  performerId?: Maybe<Scalars['Int']>
  performer?: Maybe<User>
  participants: Array<Participants>
}

export type Organization = {
  __typename?: 'Organization'
  id: Scalars['Int']
}

export type User = {
  __typename?: 'User'
  id: Scalars['Int']
  name: Scalars['String']
  email: Scalars['String']
  createdAt: Scalars['DateTime']
  performingActivities: Array<Activity>
}

export type Participants = {
  __typename?: 'Participants'
  id: Scalars['Int']
}

export type ResolverTypeWrapper<T> = Promise<T> | T

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {}
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo
) => boolean | Promise<boolean>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<
  TResult = {},
  TParent = {},
  TContext = {},
  TArgs = {}
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Query: ResolverTypeWrapper<{}>
  Activity: ResolverTypeWrapper<Activity>
  Int: ResolverTypeWrapper<Scalars['Int']>
  String: ResolverTypeWrapper<Scalars['String']>
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>
  Organization: ResolverTypeWrapper<Organization>
  User: ResolverTypeWrapper<User>
  Participants: ResolverTypeWrapper<Participants>
  DateTime: ResolverTypeWrapper<Scalars['DateTime']>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Query: {}
  Activity: Activity
  Int: Scalars['Int']
  String: Scalars['String']
  Boolean: Scalars['Boolean']
  Organization: Organization
  User: User
  Participants: Participants
  DateTime: Scalars['DateTime']
}

export type QueryResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']
> = {
  activities?: Resolver<
    Maybe<Array<ResolversTypes['Activity']>>,
    ParentType,
    ContextType
  >
}

export type ActivityResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Activity'] = ResolversParentTypes['Activity']
> = {
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  outerId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  deleted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
  updatedBy?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  updatedByUser?: Resolver<
    Maybe<ResolversTypes['User']>,
    ParentType,
    ContextType
  >
  archived?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
  organizationId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  organization?: Resolver<
    ResolversTypes['Organization'],
    ParentType,
    ContextType
  >
  performerId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>
  performer?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>
  participants?: Resolver<
    Array<ResolversTypes['Participants']>,
    ParentType,
    ContextType
  >
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type OrganizationResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Organization'] = ResolversParentTypes['Organization']
> = {
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type UserResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']
> = {
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
  performingActivities?: Resolver<
    Array<ResolversTypes['Activity']>,
    ParentType,
    ContextType
  >
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ParticipantsResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Participants'] = ResolversParentTypes['Participants']
> = {
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export interface DateTimeScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime'
}

export type Resolvers<ContextType = MercuriusContext> = {
  Query?: QueryResolvers<ContextType>
  Activity?: ActivityResolvers<ContextType>
  Organization?: OrganizationResolvers<ContextType>
  User?: UserResolvers<ContextType>
  Participants?: ParticipantsResolvers<ContextType>
  DateTime?: GraphQLScalarType
}

export type Loader<TReturn, TObj, TParams, TContext> = (
  queries: Array<{
    obj: TObj
    params: TParams
  }>,
  context: TContext & {
    reply: import('fastify').FastifyReply
  }
) => Promise<Array<import('mercurius-codegen').DeepPartial<TReturn>>>
export type LoaderResolver<TReturn, TObj, TParams, TContext> =
  | Loader<TReturn, TObj, TParams, TContext>
  | {
      loader: Loader<TReturn, TObj, TParams, TContext>
      opts?: {
        cache?: boolean
      }
    }
export interface Loaders<
  TContext = import('mercurius').MercuriusContext & {
    reply: import('fastify').FastifyReply
  }
> {
  Activity?: {
    id?: LoaderResolver<Scalars['Int'], Activity, {}, TContext>
    name?: LoaderResolver<Scalars['String'], Activity, {}, TContext>
    type?: LoaderResolver<Scalars['String'], Activity, {}, TContext>
    outerId?: LoaderResolver<Scalars['String'], Activity, {}, TContext>
    deleted?: LoaderResolver<Scalars['Boolean'], Activity, {}, TContext>
    createdAt?: LoaderResolver<Scalars['DateTime'], Activity, {}, TContext>
    updatedAt?: LoaderResolver<Scalars['DateTime'], Activity, {}, TContext>
    updatedBy?: LoaderResolver<Scalars['Int'], Activity, {}, TContext>
    updatedByUser?: LoaderResolver<Maybe<User>, Activity, {}, TContext>
    archived?: LoaderResolver<Scalars['Boolean'], Activity, {}, TContext>
    organizationId?: LoaderResolver<Scalars['Int'], Activity, {}, TContext>
    organization?: LoaderResolver<Organization, Activity, {}, TContext>
    performerId?: LoaderResolver<Maybe<Scalars['Int']>, Activity, {}, TContext>
    performer?: LoaderResolver<Maybe<User>, Activity, {}, TContext>
    participants?: LoaderResolver<Array<Participants>, Activity, {}, TContext>
  }

  Organization?: {
    id?: LoaderResolver<Scalars['Int'], Organization, {}, TContext>
  }

  User?: {
    id?: LoaderResolver<Scalars['Int'], User, {}, TContext>
    name?: LoaderResolver<Scalars['String'], User, {}, TContext>
    email?: LoaderResolver<Scalars['String'], User, {}, TContext>
    createdAt?: LoaderResolver<Scalars['DateTime'], User, {}, TContext>
    performingActivities?: LoaderResolver<Array<Activity>, User, {}, TContext>
  }

  Participants?: {
    id?: LoaderResolver<Scalars['Int'], Participants, {}, TContext>
  }
}
declare module 'mercurius' {
  interface IResolvers
    extends Resolvers<import('mercurius').MercuriusContext> {}
  interface MercuriusLoaders extends Loaders {}
}
