# MYPA Fitness — 1000-Source Discovery

Last updated: 2026-09-14
Status: DISCOVERY STARTED / RIGHTS REVIEW REQUIRED

## Objective

Build a discovery corpus of up to 1000 external websites, APIs, repositories, media libraries and creator sources that may help populate the MYPA target of 1500 canonical exercises and their demonstration media.

The number **1000** is the discovery target. It is not a count of approved download sources.

## Current verified findings

| Source | What was found | Rights / delivery signal | MYPA status |
|---|---|---|---|
| Wikimedia Commons | Category of physical-exercise videos; individual exercise files exist | Each file has its own license; exact file page must be checked | Preferred open-license discovery source |
| Wikimedia Commons / FitnessScape | Bench press demonstration | CC BY 3.0 on exact file page; attribution required | Approved-candidate class after metadata capture |
| Wikimedia Commons / FitnessScape | Squat demonstration | CC BY 3.0 on exact file page; attribution required | Approved-candidate class after metadata capture |
| Wikimedia Commons / FitnessScape | Deadlift demonstration | CC BY 3.0 on exact file page; attribution required | Approved-candidate class after metadata capture |
| Wikimedia Commons / FitnessScape | Pull-up demonstration | CC BY 3.0 on exact file page; attribution required | Approved-candidate class after metadata capture |
| Mixkit | 883 exercise stock videos and 718 workout stock videos are advertised | Mixkit License; individual asset terms still need to be recorded | Candidate; verify per-asset terms |
| YMove | 25 free downloadable exercise videos; larger 1107+ library | Commercial use advertised for free set; full app/white-label use is license-dependent | High-value licensing lead |
| ExerciseLibrary | 804+ exercise API with video links | Free/Pro API model; CDN video access is plan-dependent | API/licensing lead |
| MuscleWiki API | 1900+ exercises and 7700+ video demonstrations | API terms control; video caching/storage restrictions are explicit | Streaming/API lead, not bulk-download default |
| Exercise Animatic | Commercial fitness animation library | Commercial incorporation is licensed; raw redistribution/standalone library prohibited under listed business license | Licensing lead |
| ExerciseClips | Exercise animation library | Standard license does not allow building an app/library without extended rights | Licensing lead |
| Programme | Exercise videos | Free-to-use embedding license exists, but compiling to replicate a competing service is prohibited | Useful for embedding research; not a bulk-library source |
| Exercise Database (ZenithFits) | 317 exercises, 593 demo videos, static API | Site advertises MIT for code/data but its own page also says demo videos are for demonstration; provenance must be audited before redistribution | Candidate, rights review |
| Free Exercise DB with Videos GitHub | Same 317/593 collection and downloader | Repo explicitly warns that video provenance is uncertain despite MIT code/metadata claims | **Do not ingest media** without separate permission |
| Kinetic Exercises DB | 899 exercise metadata records | Repository presents itself as open-source; media/license details must be reviewed before use | Metadata lead |
| Kinetic.place | 1500+ exercise / premium video marketplace claims | MIT API/data claim; premium videos separately licensed | Strong licensing lead |
| ExerciseAPI.dev | Exercise API with some demo videos | Video coverage currently small; API-specific terms apply | Secondary API lead |
| ExerciseAPI.com | 183 curated exercises | API terms/free-call limits apply | Metadata/recommendation lead |
| ExerciseDB public repos | Multiple 1500+/5000+/11000+ exercise claims | Many public datasets are forks/repackagings with unclear media rights | Discovery only; no automatic ingestion |

## Important source-rights observations

1. A public website, GitHub repository or API is not automatically a redistribution license.
2. Exercise metadata and exercise media must be licensed separately when the source does not explicitly unify those rights.
3. Platform APIs may permit streaming but prohibit caching, storing or redistributing the underlying media.
4. A paid license may still prohibit reselling or redistributing the raw media library; the exact app-embedding/white-label rights must be checked.
5. Every candidate must be retained with its exact source URL, creator/owner where discoverable, license/permission basis, attribution, acquisition method and review status.

## 1000-source expansion strategy

The discovery corpus should be expanded by source class rather than by randomly collecting fitness websites:

- open-license repositories and media archives;
- public APIs and exercise databases;
- commercial exercise-video vendors with app/white-label licensing;
- creator/trainer libraries with explicit permission programs;
- stock-video libraries with commercial-use terms;
- platform APIs that explicitly permit the required app delivery model;
- university/public-health/education repositories where individual assets carry reuse rights;
- multilingual and regional exercise creators whose rights can be documented.

Each candidate is normalized to a domain/source record and de-duplicated before counting toward the 1000 target.

## Acquisition gate

The discovery list feeds the MYPA rights-aware acquisition pipeline. Only records explicitly promoted to `approved` may be downloaded. A candidate source remains non-downloadable until:

- exact asset is identified;
- rights basis is known and compatible with MYPA's intended distribution;
- attribution requirements are captured;
- creator/owner is captured when available;
- storage/redistribution restrictions are understood;
- reviewer and review timestamp are recorded.

This prevents a 1000-site crawl from becoming a 1000-site copyright/ToS violation.

## Current next step

Continue discovery toward the 1000-source corpus, but rank sources by expected legal/usability value. High-value targets are sources with explicit commercial/app-embedding rights or clearly open licenses. Then ingest only the approved subset and measure how many of the 1500 target exercises receive exact-match media.
