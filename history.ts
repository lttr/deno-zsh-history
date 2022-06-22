import { path } from "./deps.ts";

const historyFileName = ".zsh_history";
const home = Deno.env.get("HOME") || "~";
const pathToHistory = path.join(home, historyFileName);

export async function zshHistory(
  filePath: string = pathToHistory,
): Promise<HistoryRecord[]> {
  const historyFileContents: string[] = await readHistoryFile(filePath);
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

async function readHistoryFile(pathToHistoryFile: string) {
  let rawHistory: string[] = [];
  try {
    const historyString = await Deno.readTextFile(pathToHistoryFile);
    rawHistory = historyString.split("\n");
  } catch (err) {
    throw new Error(
      `Zsh history file not found on path '${pathToHistoryFile}'`,
      { cause: err },
    );
  }
  return rawHistory;
}

export interface HistoryRecord {
  time: Date | null;
  command: string;
}
