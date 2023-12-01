import Client, { Directory, Secret } from "../../deps.ts";
import { connect } from "../../sdk/connect.ts";
import { getDirectory, getSpinAuthToken } from "./lib.ts";

export enum Job {
  build = "build",
  deploy = "deploy",
}

export const exclude = ["target", ".git", ".fluentci"];

/**
 * @function
 * @description Build your application (only Rust is supported at the moment)
 * @param {string | Directory | undefined} src
 * @returns {string}
 */
export async function build(
  src: string | Directory = "."
): Promise<Directory | string> {
  let id = "";
  await connect(async (client: Client) => {
    const context = getDirectory(client, src);
    const ctr = client
      .pipeline(Job.build)
      .container()
      .from("rust:1.72-bookworm")
      .withExec(["apt", "update"])
      .withExec(["apt", "install", "-y", "curl"])
      .withExec([
        "sh",
        "-c",
        "curl -fsSL https://developer.fermyon.com/downloads/install.sh | bash",
      ])
      .withExec(["mv", "spin", "/usr/local/bin/spin"])
      .withExec(["rustup", "target", "add", "wasm32-wasi"])
      .withMountedCache(
        "/root/.cargo/registry",
        client.cacheVolume("cargo-cache")
      )
      .withMountedCache(
        "/root/.cargo/git",
        client.cacheVolume("cargo-git-cache")
      )
      .withMountedCache("/app/target", client.cacheVolume("spin-target-cache"))
      .withDirectory("/app", context, { exclude })
      .withWorkdir("/app")
      .withExec(["spin", "build"])
      .withExec(["cp", "-r", "/app/target/wasm32-wasi", "/wasm32-wasi"]);

    await ctr.stdout();
    const dir = await ctr.directory("/wasm32-wasi");

    id = await dir.id();
  });
  return id;
}

/**
 * @function
 * @description Package and upload your application to the Fermyon Cloud
 * @param {string | Directory | undefined} src
 * @param {string} cachePath
 * @param {string} cacheKey
 * @param {string | Secret} authToken
 * @returns {string}
 */
export async function deploy(
  src: string | Directory | undefined = ".",
  cachePath = "/app/target",
  cacheKey = "spin-target-cache",
  authToken?: string | Secret
): Promise<string> {
  const cache = [
    {
      path: cachePath,
      key: cacheKey,
    },
  ];

  await connect(async (client: Client) => {
    const context = getDirectory(client, src);
    const secret = getSpinAuthToken(client, authToken);

    if (!secret) {
      console.error("SPIN_AUTH_TOKEN is not set");
      Deno.exit(1);
    }

    let baseCtr = client
      .pipeline(Job.deploy)
      .container()
      .from("rust:1.72-bookworm")
      .withExec(["apt", "update"])
      .withExec(["apt", "install", "-y", "curl"])
      .withExec([
        "sh",
        "-c",
        "curl -fsSL https://developer.fermyon.com/downloads/install.sh | bash",
      ])
      .withExec(["mv", "spin", "/usr/local/bin/spin"])
      .withExec(["rustup", "target", "add", "wasm32-wasi"]);

    for (const { path, key } of cache) {
      baseCtr = baseCtr.withMountedCache(path, client.cacheVolume(key));
    }

    const ctr = baseCtr
      .withSecretVariable("SPIN_AUTH_TOKEN", secret)
      .withDirectory("/app", context, { exclude })
      .withWorkdir("/app")
      .withExec(["spin", "login", "--auth-method", "token"])
      .withExec(["ls", "-la", "/app"])
      .withExec(["ls", "-la", "/app/target"])
      .withExec(["spin", "deploy"]);

    const result = await ctr.stdout();

    console.log(result);
  });

  return "done";
}

export type JobExec = (
  src?: string
) =>
  | Promise<Directory | string>
  | ((src?: string, cachePath?: string, cacheKey?: string) => Promise<string>);

export const runnableJobs: Record<Job, JobExec> = {
  [Job.build]: build,
  [Job.deploy]: deploy,
};

export const jobDescriptions: Record<Job, string> = {
  [Job.build]: "Build your application (only Rust is supported at the moment)",
  [Job.deploy]: "Package and upload your application to the Fermyon Cloud",
};
