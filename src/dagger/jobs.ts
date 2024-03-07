import { Directory, Secret, dag } from "../../deps.ts";
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
  src: string | Directory
): Promise<Directory | string> {
  const context = await getDirectory(src);
  const ctr = dag
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
    .withMountedCache("/root/.cargo/registry", dag.cacheVolume("cargo-cache"))
    .withMountedCache("/root/.cargo/git", dag.cacheVolume("cargo-git-cache"))
    .withMountedCache("/app/target", dag.cacheVolume("spin-target-cache"))
    .withDirectory("/app", context, { exclude })
    .withWorkdir("/app")
    .withExec(["spin", "build"])
    .withExec(["cp", "-r", "/app/target/wasm32-wasi", "/wasm32-wasi"]);

  await ctr.stdout();
  const dir = await ctr.directory("/wasm32-wasi");

  await dir.export("./target/wasm32-wasi");

  const id = await dir.id();
  return id;
}

/**
 * @function
 * @description Package and upload your application to the Fermyon Cloud
 * @param {string | Directory | undefined} src
 * @param {string | Secret} authToken
 * @returns {string}
 */
export async function deploy(
  src: string | Directory,
  authToken: string | Secret
): Promise<string> {
  const context = await getDirectory(src);
  const secret = await getSpinAuthToken(authToken);

  if (!secret) {
    console.error("SPIN_AUTH_TOKEN is not set");
    Deno.exit(1);
  }

  const baseCtr = dag
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

  const ctr = baseCtr
    .withSecretVariable("SPIN_AUTH_TOKEN", secret)
    .withDirectory("/app", context)
    .withWorkdir("/app")
    .withExec(["spin", "login", "--auth-method", "token"])
    .withExec(["ls", "-la", "/app"])
    .withExec(["ls", "-la", "/app/target"])
    .withExec(["spin", "deploy"]);

  const result = await ctr.stdout();
  return result;
}

export type JobExec =
  | ((src: string) => Promise<Directory | string>)
  | ((src: string, token: string | Secret) => Promise<string>);

export const runnableJobs: Record<Job, JobExec> = {
  [Job.build]: build,
  [Job.deploy]: deploy,
};

export const jobDescriptions: Record<Job, string> = {
  [Job.build]: "Build your application (only Rust is supported at the moment)",
  [Job.deploy]: "Package and upload your application to the Fermyon Cloud",
};
