import { Alias, extractAliases } from "./aliases.ts";
import { HistoryRecord, zshHistory } from "./history.ts";

// Extract zsh history from file
const history: HistoryRecord[] = await zshHistory();

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

// Types

interface AliasesUsage {
  alias: string;
  lastUsed: Date | null;
}
