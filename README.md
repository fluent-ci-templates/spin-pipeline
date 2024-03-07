# Spin Pipeline

[![fluentci pipeline](https://img.shields.io/badge/dynamic/json?label=pkg.fluentci.io&labelColor=%23000&color=%23460cf1&url=https%3A%2F%2Fapi.fluentci.io%2Fv1%2Fpipeline%2Fspin_pipeline&query=%24.version)](https://pkg.fluentci.io/spin_pipeline)
[![deno module](https://shield.deno.dev/x/spin_pipeline)](https://deno.land/x/spin_pipeline)
![deno compatibility](https://shield.deno.dev/deno/^1.37)
[![dagger-min-version](https://img.shields.io/badge/dagger-v0.10.0-blue?color=3D66FF&labelColor=000000)](https://dagger.io)
[![](https://jsr.io/badges/@fluentci/spin)](https://jsr.io/@fluentci/spin)
[![](https://img.shields.io/codecov/c/gh/fluent-ci-templates/spin-pipeline)](https://codecov.io/gh/fluent-ci-templates/spin-pipeline)
[![ci](https://github.com/fluent-ci-templates/spin-pipeline/actions/workflows/ci.yml/badge.svg)](https://github.com/fluent-ci-templates/spin-pipeline/actions/workflows/ci.yml)


A ready-to-use CI/CD Pipeline for building and deploying your [Spin](https://www.fermyon.com/spin) applications to [Fermyon Platform](https://www.fermyon.com/platform).

## 🚀 Usage

Run the following command:

```bash
fluentci run spin_pipeline
```

## 🧩 Dagger Module

Use as a [Dagger](https://dagger.io) Module:

```bash
dagger install github.com/fluent-ci-templates/spin-pipeline@main
```

Call a function from the module:

```bash
dagger call build --src .
dagger call deploy --src . --auth-token SPIN_AUTH_TOKEN
```

## 🛠️ Environment Variables

| Variable        | Description                      |
|-----------------|----------------------------------|
| SPIN_AUTH_TOKEN | Your Fermyon Cloud Access Token. |

## ✨ Jobs

| Job     | Description                                                         |
|---------|---------------------------------------------------------------------|
| build   | Build your Spin application (Only Rust is supported at the moment). |
| deploy  | Deploy your Spin application to Fermyon Platform.                   |

```typescript
build(
  src: string | Directory
): Promise<Directory | string>

deploy(
  src: string | Directory,
  authToken: string | Secret,
): Promise<string>
```

## 👨‍💻 Programmatic usage

You can also use this pipeline programmatically:

```typescript
import { build, deploy } from "jsr:@fluentci/spin";

await build();
await deploy(".", Deno.env.get("SPIN_AUTH_TOKEN")!);
```
