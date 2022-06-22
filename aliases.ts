export interface Alias {
  key: string;
  value: string;
}

export async function extractAliases(): Promise<Alias[] | null> {
  const { success, output } = await command([
    "zsh",
    "--interactive",
    "-c",
    "alias",
  ]);
  if (success) {
    return parseAliases(output.split("\n"));
  }
  return null;
}

function parseAliases(rawAliases: string[]): Alias[] {
  return rawAliases.map((alias) => {
    const indexOfDelimeter = alias.indexOf("=");
    return {
      key: alias.substring(0, indexOfDelimeter),
      value: alias
        .substring(indexOfDelimeter + 1)
        .replace(/^'/, "")
        .replace(/'$/, ""),
    };
  });
}

async function command(params: string[]): Promise<{
  success: boolean;
  code: number;
  output: string;
}> {
  const process = Deno.run({
    cmd: params,
    stdout: "piped",
  });
  const { success, code } = await process.status();
  const stdout = await process.output();
  const output = new TextDecoder().decode(stdout).trim();
  process.close();
  return { success, code, output };
}
