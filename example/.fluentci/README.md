# Spin Pipeline

[![deno module](https://shield.deno.dev/x/spin_pipeline)](https://deno.land/x/spin_pipeline)
![deno compatibility](https://shield.deno.dev/deno/^1.34)
[![](https://img.shields.io/codecov/c/gh/fluent-ci-templates/spin-pipeline)](https://codecov.io/gh/fluent-ci-templates/spin-pipeline)

A ready-to-use CI/CD Pipeline for building and deploying your [Spin](https://www.fermyon.com/spin) applications to [Fermyon Platform](https://www.fermyon.com/platform).

## 🚀 Usage

Run the following command:

```bash
dagger run fluentci spin_pipeline
```

## Environment Variables

| Variable        | Description                      |
|-----------------|----------------------------------|
| SPIN_AUTH_TOKEN | Your Fermyon Cloud Access Token. |

## Jobs

| Job     | Description                                                         |
|---------|---------------------------------------------------------------------|
| build   | Build your Spin application (Only Rust is supported at the moment). |
| deploy  | Deploy your Spin application to Fermyon Platform.                   |

## Programmatic usage

You can also use this pipeline programmatically:

```typescript
import { Client, connect } from "https://esm.sh/@dagger.io/dagger@0.8.1";
import { Dagger } from "https://deno.land/x/fly_pipeline/mod.ts";

const { build, deploy } = Dagger;

function pipeline(src = ".") {
  connect(async (client: Client) => {
    await build(client, src);
    await deploy(client, src);
  });
}

pipeline();

```