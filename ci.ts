import {
  build,
  deploy,
} from "https://pkg.fluentci.io/spin_pipeline@v0.8.0/mod.ts";

await build();
await deploy();
