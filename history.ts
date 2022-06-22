import * as path from "https://deno.land/std@0.144.0/path/mod.ts";

// Constants
const historyFileName = ".zsh_history";
const home = Deno.env.get("HOME") || "~";
const pathToHistory = path.join(home, historyFileName);

// Extract zsh history from file
const history: HistoryRecord[] = await extractHistory();

// Extract zsh aliases
const aliases = await extractAliases();

// Find used aliases
const usage = findUseOfAliases(aliases, history);

console.log(formatUsage(usage));

// Functions

function formatUsage(usage: AliasesUsage[]): string {
  return usage
    .map((record) => {
      const datetime = record.lastUsed
        ? record.lastUsed.toISOString().substr(0, 10)
        : "";
      return `${datetime} ${record.alias}`;
    })
    .join("\n");
}

function findUseOfAliases(
  aliases: Alias[] | null,
  history: HistoryRecord[]
): AliasesUsage[] {
  if (!aliases || !history || aliases?.length < 0 || history.length < 0) {
    console.warn("There is not enough data to compute usage of aliases");
    return [];
  }
  const aliasesMap = new Map<string, Date | null>(
    aliases.map((alias) => [alias.key, null])
  );
  for (const historyRecord of history) {
    if (aliasesMap.has(historyRecord.command)) {
      aliasesMap.set(historyRecord.command, historyRecord.time);
    }
  }
  const aliasesUsage: AliasesUsage[] = [...aliasesMap.entries()].map(
    ([alias, lastUsed]) => ({ alias, lastUsed })
  );
  aliasesUsage.sort((a, b) => {
    if (!a.lastUsed && !b.lastUsed) {
      return 0;
    }
    if (!b.lastUsed) {
      return -1;
    }
    if (!a.lastUsed) {
      return 1;
    }
    return b.lastUsed.getTime() - a.lastUsed.getTime();
  });
  return aliasesUsage;
}

async function extractAliases(): Promise<Alias[] | null> {
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

async function extractHistory(): Promise<HistoryRecord[]> {
  const historyFileContents: string[] = await readHistoryFile();
  const historyCleaned: string[] = reduceMultilineCommands(historyFileContents);
  return parseHistory(historyCleaned);
}

function parseHistory(history: string[]): HistoryRecord[] {
  return history
    .map((record) => {
      const regexLine = /^: (?<time>\d+):[0-9.]+;(?<command>.*)$/ms;
      const match = regexLine.exec(record);
      const timestamp = match?.groups?.time;
      const time = timestamp ? new Date(parseInt(timestamp) * 1000) : null;
      const command = match?.groups?.command ?? "";
      return {
        time,
        command,
      };
    })
    .filter((record) => Boolean(record.command));
}

function reduceMultilineCommands(rawHistory: string[]) {
  const reducedHistory: string[] = [rawHistory[0]];
  let cleanedIndex = 0;
  for (let index = 1; index < rawHistory.length; index++) {
    const rawLine = rawHistory[index];
    const cleanedLine = reducedHistory[cleanedIndex];
    if (reducedHistory[cleanedIndex].endsWith("\\")) {
      reducedHistory[cleanedIndex] = [cleanedLine, rawLine].join("\n");
    } else {
      reducedHistory.push(rawHistory[index]);
      cleanedIndex += 1;
    }
  }
  return reducedHistory;
}

async function readHistoryFile() {
  let rawHistory: string[] = [];
  try {
    const historyString = await Deno.readTextFile(pathToHistory);
    rawHistory = historyString.split("\n");
  } catch (_) {
    console.error(`Zsh history file not found on path '${pathToHistory}'`);
  }
  return rawHistory;
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

// Types

interface Alias {
  key: string;
  value: string;
}

interface HistoryRecord {
  time: Date | null;
  command: string;
}

interface AliasesUsage {
  alias: string;
  lastUsed: Date | null;
}
