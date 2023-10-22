import Client, { connect } from "../../deps.ts";

export enum Job {
  build = "build",
  deploy = "deploy",
}

export const exclude = ["target", ".git", ".fluentci"];

export const build = async (src = ".") => {
  await connect(async (client: Client) => {
    const context = client.host().directory(src);
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
      .withExec(["spin", "build"]);

    const result = await ctr.stdout();

    console.log(result);
  });
  return "done";
};

export const deploy = async (
  src = ".",
  cachePath = "/app/target",
  cacheKey = "spin-target-cache",
  authToken?: string
) => {
  if (!Deno.env.get("SPIN_AUTH_TOKEN") && !authToken) {
    console.error("SPIN_AUTH_TOKEN is not set");
    Deno.exit(1);
  }

  const cache = [
    {
      path: cachePath,
      key: cacheKey,
    },
  ];

  if (authToken) {
    Deno.env.set("SPIN_AUTH_TOKEN", authToken);
  }

  await connect(async (client: Client) => {
    const context = client.host().directory(src);
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
      .withEnvVariable("SPIN_AUTH_TOKEN", Deno.env.get("SPIN_AUTH_TOKEN")!)
      .withDirectory("/app", context, { exclude })
      .withWorkdir("/app")
      .withExec(["spin", "login", "--auth-method", "token"])
      .withExec(["spin", "deploy"]);

    const result = await ctr.stdout();

    console.log(result);
  });

  return "done";
};

export type JobExec = (
  src?: string
) =>
  | Promise<string>
  | ((src?: string, cachePath?: string, cacheKey?: string) => Promise<string>);

export const runnableJobs: Record<Job, JobExec> = {
  [Job.build]: build,
  [Job.deploy]: deploy,
};

export const jobDescriptions: Record<Job, string> = {
  [Job.build]: "Build your application (only Rust is supported at the moment)",
  [Job.deploy]: "Package and upload your application to the Fermyon Cloud",
};
