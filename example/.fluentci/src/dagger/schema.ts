import {
  queryType,
  makeSchema,
  dirname,
  join,
  resolve,
  stringArg,
  nonNull,
} from "../../deps.ts";

import { build, deploy } from "./jobs.ts";

const Query = queryType({
  definition(t) {
    t.string("build", {
      args: {
        src: nonNull(stringArg()),
      },
      resolve: async (_root, args, _ctx) => await build(args.src),
    });
    t.string("deploy", {
      args: {
        src: nonNull(stringArg()),
        cachePath: stringArg(),
        cacheKey: stringArg(),
        authToken: nonNull(stringArg()),
      },
      resolve: async (_root, args, _ctx) =>
        await deploy(
          args.src,
          args.cachePath || undefined,
          args.cacheKey || undefined,
          args.authToken
        ),
    });
  },
});

const schema = makeSchema({
  types: [Query],
  outputs: {
    schema: resolve(join(dirname(".."), dirname(".."), "schema.graphql")),
    typegen: resolve(join(dirname(".."), dirname(".."), "gen", "nexus.ts")),
  },
});

schema.description = JSON.stringify({
  "build.src": "directory",
  "deploy.src": "directory",
});

export { schema };
