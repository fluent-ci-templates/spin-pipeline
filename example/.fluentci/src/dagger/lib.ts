import Client, {
  Directory,
  DirectoryID,
  Secret,
  SecretID,
} from "../../deps.ts";

export const getDirectory = async (
  client: Client,
  src: string | Directory | undefined = "."
) => {
  if (typeof src === "string") {
    try {
      const directory = client.loadDirectoryFromID(src as DirectoryID);
      await directory.id();
      return directory;
    } catch (_) {
      return client.host().directory(src);
    }
  }
  return src instanceof Directory ? src : client.host().directory(src);
};

export const getSpinAuthToken = (client: Client, token?: string | Secret) => {
  if (Deno.env.get("SPIN_AUTH_TOKEN")) {
    return client.setSecret(
      "SPIN_AUTH_TOKEN",
      Deno.env.get("SPIN_AUTH_TOKEN")!
    );
  }
  if (token && typeof token === "string") {
    if (token.startsWith("core.Secret")) {
      return client.loadSecretFromID(token as SecretID);
    }
    return client.setSecret("SPIN_AUTH_TOKEN", token);
  }
  if (token && token instanceof Secret) {
    return token;
  }
  return undefined;
};
