import Client from "@dagger.io/dagger";

export enum Job {
  build = "build",
  deploy = "deploy",
}

export const build = async (client: Client, src = ".") => {
  const context = client.host().directory(src);
  const ctr = client
    .pipeline(Job.build)
    .container()
    .from("rust:1.71-bookworm")
    .withExec(["apt", "update"])
    .withExec(["apt", "install", "-y", "curl"])
    .withExec([
      "sh",
      "-c",
      "curl -fsSL https://developer.fermyon.com/downloads/install.sh | bash",
    ])
    .withExec(["mv", "spin", "/usr/local/bin/spin"])
    .withExec(["rustup", "target", "add", "wasm32-wasi"])
    .withMountedCache("/app/target", client.cacheVolume("spin-target-cache"))
    .withDirectory("/app", context, { exclude: ["target"] })
    .withWorkdir("/app")
    .withExec(["spin", "build"]);

  const result = await ctr.stdout();

  console.log(result);
};

export const deploy = async (
  client: Client,
  src = ".",
  cache: Record<string, string>[] = [
    { path: "/app/target", key: "spin-target-cache" },
  ]
) => {
  if (!Deno.env.get("SPIN_AUTH_TOKEN")) {
    console.error("SPIN_AUTH_TOKEN is not set");
    Deno.exit(1);
  }
  const context = client.host().directory(src);
  let baseCtr = client
    .pipeline(Job.deploy)
    .container()
    .from("rust:1.71-bookworm")
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
    .withDirectory("/app", context, { exclude: ["target"] })
    .withWorkdir("/app")
    .withExec(["spin", "login", "--auth-method", "token"])
    .withExec(["spin", "deploy"]);

  const result = await ctr.stdout();

  console.log(result);
};

export type JobExec = (
  client: Client,
  src?: string
) =>
  | Promise<void>
  | ((
      client: Client,
      src?: string,
      options?: {
        ignore: string[];
      }
    ) => Promise<void>);

export const runnableJobs: Record<Job, JobExec> = {
  [Job.build]: build,
  [Job.deploy]: deploy,
};

export const jobDescriptions: Record<Job, string> = {
  [Job.build]: "Build your application (only Rust is supported at the moment)",
  [Job.deploy]: "Package and upload your application to the Fermyon Cloud",
};
