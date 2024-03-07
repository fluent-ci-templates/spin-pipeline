import * as jobs from "./jobs.ts";

const { build, deploy, runnableJobs } = jobs;

export default async function pipeline(src = ".", args: string[] = []) {
  if (args.length > 0) {
    await runSpecificJobs(args as jobs.Job[]);
    return;
  }
  await build(src);
  await deploy(src, Deno.env.get("SPIN_AUTH_TOKEN")!);
}

async function runSpecificJobs(args: jobs.Job[]) {
  for (const name of args) {
    const job = runnableJobs[name];
    if (!job) {
      throw new Error(`Job ${name} not found`);
    }
    await job(".", Deno.env.get("SPIN_AUTH_TOKEN")!);
  }
}
