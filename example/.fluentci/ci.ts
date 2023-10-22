import Client, { connect } from "https://sdk.fluentci.io/v0.1.9/mod.ts";
import {
  build,
  deploy,
} from "https://pkg.fluentci.io/spin_pipeline@v0.5.2/mod.ts";

function pipeline(src = ".") {
  connect(async (client: Client) => {
    await build(client, src);
    await deploy(client, src);
  });
}

pipeline();
