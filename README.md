# Zsh history

Retrieve and parse zsh history from its common location `~/.zsh_history`.

This package is written for `deno` and compiled for `node` using `dnt`.


## Usage (for deno)

```typescript
import { zshHistory } from "https://deno.land/x/zsh_history/mod.ts";

const history = await zshHistory();
// or
const history = await zshHistory(customPath);
```

## Usage (for node)

```typescript
import { zshHistory } from "@lttr/zsh-history";
const history = await zshHistory();
```

## Testing

```
deno task test
```

## First: Deno x publishing

This package is automatically [published](https://deno.land/x/shell_aliases) when new tag with version is pushed to the Github repository.

```
git describe --tags # get last tag
git tag <version>
git push --tags
```

## Second: NPM publishing

There is a build script that uses [dnt](https://deno.land/x/dnt) and compiles a
npm package.

```
deno run -A _build.ts <version>
cd npm
npm publish
deno task clean
```

## Prior art

https://github.com/danasilver/zsh-history

