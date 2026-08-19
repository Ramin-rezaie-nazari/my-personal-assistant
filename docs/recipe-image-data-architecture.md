# Recipe image data architecture

## Development

The extracted source dataset and original recipe images live outside Git in local storage. They are treated as immutable source assets.

Recommended local layout:

```text
My-Personal-Assistant-Data/
├── originals/      # immutable source images / datasets
├── processed/      # generated WebP assets
├── manifests/      # import/reprocess manifests
├── exports/        # optional CSV/JSON exports
└── backups/        # local backups
```

The current extracted dataset can remain at `apps/backend/recipe-image-dataset/` during development. It is ignored by Git.

## Processing contract

- Source image mapping is exact via the dataset `Image_Name` field.
- Original files are never modified in-place.
- Application images are WebP.
- Hard maximum is 60KB per stored recipe hero image.
- The reprocessor prefers the best visual result that fits under 60KB rather than minimizing file size.
- A failed DB update removes the newly uploaded object so partial records are not retained.
- Supabase Storage is the application delivery layer; the local dataset is the development/master source.

## Production migration

When the application is ready for release, the same source-to-WebP pipeline can be run on a VPS/worker without changing the application data model. The local originals should remain as a backup/master copy until the production migration has been verified.
