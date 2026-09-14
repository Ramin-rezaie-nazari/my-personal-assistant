# MYPA Fitness — 1000-Source Discovery

Last updated: 2026-09-14
Status: DISCOVERY STARTED / RIGHTS REVIEW REQUIRED

## Objective

Build a discovery corpus of up to 1000 external websites, APIs, repositories, media libraries and creator sources that may help populate the MYPA target of 1500 canonical exercises and their demonstration media.

The number **1000** is the discovery target. It is not a count of approved download sources.

## Discovery model

Sources are normalized by domain/provider and classified by expected value:

- `open-license-media-archive`
- `commercial-license-video`
- `commercial-license-library`
- `commercial-license-library-api`
- `commercial-license-animation`
- `commercial-api-media`
- `open-license-exercise-data`
- `stock-video-platform`
- `exercise-api-media`
- `embedding-license-lead`
- `rights-review-required`

The source registry seed is stored in `data/fitness-source-registry.seed.json` so discovery does not remain documentation-only.

## Current high-value findings

| Source | What was found | Rights / delivery signal | MYPA status |
|---|---|---|---|
| Wikimedia Commons | Physical-exercise video archive and individual exercise demonstration files | Exact file page carries its own license | Preferred open-license discovery source |
| Wikimedia Commons / FitnessScape | Bench press, squat, deadlift, pull-up, shoulder press, leg-raises, incline press, hanging crunches and additional demonstration files were identified | Exact files can carry CC BY 3.0 attribution terms | Approved-candidate class after metadata capture |
| YMove | 25 free downloadable exercise videos; 1107+ total library advertised | Free set advertises commercial use and direct download; full library has separate white-label/API licensing | High-value licensing lead |
| ExerciseVideoAPI | 290 HD real filmed demonstration videos | Advertised perpetual commercial licence, white-label, instant download and self-hosting | High-value licensing lead |
| Fitter Stock | 3500+ exercise assets and 1000+ videos advertised | White-label/platform-ready commercial licensing | High-value licensing lead |
| Funxtion FXCONTENT | 3500+ exercises, 1000+ workouts, 650+ virtual classes | REST API, SDK and white-label commercial content platform | High-value licensing lead |
| WorkoutDB | ~873 exercises with demo video | Paid Pro/Scale plans advertise commercial in-product media/data use; no dataset redistribution | API/media lead |
| MuscleWiki API | Large exercise/video catalog | Commercial use intended; redistribution/own API/competing dataset restricted | Streaming/API lead, not bulk-download default |
| ExerciseAPI | Exercise catalog/data | Data advertised as CC BY 4.0; attribution required | Strong metadata source |
| RepDB | 601-exercise free snapshot with original illustrations and metadata | Free commercial in-app use with attribution; no dataset redistribution | Strong metadata/visual source |
| MoveKit | 400+ exercise animations | Standard commercial licence; app use allowed; raw asset redistribution prohibited | Commercial visual lead |
| Exercise Animatic | Commercial exercise animation library | Lifetime commercial licensing advertised, including paid mobile apps | Commercial visual lead |
| ExerciseClips | Exercise animation library | Standard licence excludes app/platform library; Extended Licence required | Commercial visual lead with licence gate |
| White Label Workouts | Exercise demos + explainers | Marketed for apps/client programs under white-label terms | Commercial video lead |
| Pexels Videos | Large stock video platform | Commercial platform licence, but per-asset/person/brand suitability and redistribution limits apply | Candidate only |
| Pixabay Videos | Large stock video platform | Commercial platform licence, but standalone redistribution and asset-specific conditions apply | Candidate only |
| Mixkit | Large exercise/workout stock-video catalogs | Platform licence with asset-level terms | Candidate only |
| Kinetic.place | Large exercise catalogue and premium video marketplace | Data/API and premium video rights are separate | Licensing lead |
| ExerciseLibrary API | 800+ exercise API with video links advertised | Access/caching/storage depends on API plan/terms | API/media lead |
| Programme | Exercise video/embedding ecosystem | Embedding/licensing route exists; competing compiled library restrictions apply | Embedding lead only |
| Gym visual derived public datasets | Many GitHub repos repackage Gym visual media | Public repo MIT often covers code/data only; media retains separate rights | Blocked until direct licence |

## Rights lessons established during discovery

1. A public website, GitHub repository or API is not automatically a redistribution licence.
2. Exercise metadata and exercise media can have separate rights.
3. Platform APIs may permit streaming while prohibiting caching, storing or redistributing underlying media.
4. A commercial licence can permit in-app use while prohibiting raw-file redistribution or a competing media library.
5. Exact source URL, creator/owner, rights basis, attribution, acquisition mode, storage/delivery restrictions and review timestamp must be retained per asset.
6. `approved` is an asset-level state, not a domain-level assumption.

## Current approved-media seed

The rights-gated download manifest contains exact open-license demonstration files from Wikimedia Commons and records creator, source reference, license and attribution. These entries are the first controlled ingestion set; they do not imply every file from Wikimedia or any other source is approved.

## 1000-source expansion strategy

The corpus will be expanded by source class and de-duplicated by canonical domain/provider:

- open-license repositories and media archives;
- public exercise APIs and structured databases;
- commercial exercise-video vendors with app/white-label rights;
- creator/trainer libraries with explicit permission programs;
- stock-video libraries with commercial-use terms;
- platform APIs with explicit in-product delivery rights;
- university/public-health/education repositories with asset-level reuse rights;
- multilingual and regional creators with documented permission;
- animation providers with app/platform licensing;
- specialist rehabilitation, mobility, yoga, pilates, calisthenics and functional-movement libraries.

Target is to maximize useful, rights-compatible coverage of the 1500-exercise catalog rather than merely maximize raw domain count.

## Acquisition gate

Only records promoted to `approved` may be downloaded. A candidate remains non-downloadable until:

- exact asset is identified;
- rights basis is compatible with MYPA's intended distribution;
- attribution requirements are captured;
- creator/owner is captured when available;
- storage/redistribution restrictions are understood;
- reviewer and review timestamp are recorded;
- download host is explicitly allow-listed.

This prevents a 1000-source crawl from becoming a 1000-source copyright/ToS violation.

## Current next step

Continue source discovery aggressively toward the 1000-source target, but rank every source by legal/usability value. Prioritize sources that can supply exact, commercially usable, self-hostable assets for the 1500-exercise target. Then ingest the approved subset, calculate exact exercise coverage, and fill remaining gaps through licensed purchase or MYPA-original production.
