import {
  build,
  deploy,
} from "https://pkg.fluentci.io/spin_pipeline@v0.6.1/mod.ts";

await build();
await deploy();
