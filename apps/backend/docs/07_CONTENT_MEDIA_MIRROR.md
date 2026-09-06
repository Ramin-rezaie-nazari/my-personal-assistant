# MYPA Content + Media Mirror

## Goal

The full recipe and fitness corpus is kept outside the APK. Heavy media is mirrored to a developer-controlled local folder on the Mac, then copied to VPS/object storage later. The mobile app consumes remote URLs and can cache each asset locally after first use.

## Local mirror

From `apps/backend`:

```bash
MYPA_CONTENT_MIRROR_ROOT="$HOME/MYPA-content-mirror" pnpm content:mirror
```

Recipes only:

```bash
MYPA_CONTENT_MIRROR_ROOT="$HOME/MYPA-content-mirror" pnpm content:mirror:recipes
```

Fitness only:

```bash
MYPA_CONTENT_MIRROR_ROOT="$HOME/MYPA-content-mirror" pnpm content:mirror:fitness
```

The process is resumable. `manifest.json` records source, license, checksum, local path, remote-ready object key, status, and required media count. Existing complete files are not downloaded again.

## Completeness contract

The release default is **4 approved WebP media files per item**. An item is `complete` only when all required media files are actually present on disk. Missing source media is never silently replaced by duplicates or fake placeholders; it remains `incomplete` so the corpus cannot be falsely marked ready.

`content-mirror-audit.mjs` re-checks the manifest against the real filesystem:

```bash
MYPA_CONTENT_MIRROR_ROOT="$HOME/MYPA-content-mirror" pnpm exec node ./scripts/content-mirror-audit.mjs
```

The mirror exits with status `2` when the corpus is not fully complete. This is intentional and can be used as a release gate.

## Output layout

```text
$HOME/MYPA-content-mirror/
  manifest.json
  summary.json
  media/
    recipes/<recipe-slug>/<position>-<content-hash>.webp
    fitness/<discipline>/<exercise-slug>/<position>-<content-hash>.webp
```

The mirror is gitignored and must not be imported by Expo/React Native as a bundled asset.

## Source policy

Recipe media candidates come from Wikibooks/Wikimedia and are filtered for permissive licenses supported by the app policy. Fitness candidates start with Free Exercise DB and can use Wikimedia Commons as an additional candidate source. Every mirrored asset retains attribution/provenance metadata in the manifest.

## VPS handoff

The local `media/` tree is already structured as object-storage keys. Later deployment can upload the tree unchanged to a VPS disk, S3-compatible object storage, or a CDN origin. The application should publish URLs derived from these object keys rather than bundling the files into the APK.

## Client caching rule

The mobile client should cache recipe/exercise media by immutable content hash/object URL. First open downloads the asset; later opens read the cached file. Cache metadata must survive normal app navigation and must not be treated as an APK asset.
