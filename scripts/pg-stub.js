// Empty stub for pg module - we use @supabase/supabase-js (HTTP API) instead of direct pg connections
// This stub prevents bundling errors when coze-coding-dev-sdk references pg
module.exports = {
  Pool: class Pool {
    constructor() { throw new Error('pg Pool is not available. Use Supabase client instead.'); }
  },
  Client: class Client {
    constructor() { throw new Error('pg Client is not available. Use Supabase client instead.'); }
  },
  Query: class Query {
    constructor() { throw new Error('pg Query is not available. Use Supabase client instead.'); }
  },
  types: {},
  defaults: {},
};
