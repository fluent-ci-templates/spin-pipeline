import { BuildSpec } from "fluent_aws_codepipeline";

export function generateYaml(): BuildSpec {
  const buildspec = new BuildSpec();
  buildspec
    .env({
      "secrets-manager": {
        SPIN_AUTH_TOKEN: "spin:SPIN_AUTH_TOKEN",
      },
    })
    .phase("install", {
      commands: [
        "curl -fsSL https://deno.land/x/install/install.sh | sh",
        'export DENO_INSTALL="$HOME/.deno"',
        'export PATH="$DENO_INSTALL/bin:$PATH"',
        "deno install -A -r https://cli.fluentci.io -n fluentci",
        "curl -L https://dl.dagger.io/dagger/install.sh | DAGGER_VERSION=0.8.1 sh",
        "mv bin/dagger /usr/local/bin",
        "dagger version",
      ],
    })
    .phase("build", {
      commands: ["fluentci run spin_pipeline"],
    })
    .phase("post_build", {
      commands: ["echo Build completed on `date`"],
    });
  return buildspec;
}
