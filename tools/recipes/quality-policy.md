# Recipe production quality policy

A recipe is production-eligible only when its source is explicitly permitted for production use and it passes the automated quality gate.

## Required content

- Real dish name and cuisine/country context.
- At least 4 ingredients with positive quantities and understandable units or gram equivalents.
- At least 3 cooking steps, written as actionable instructions.
- Serving count greater than zero.
- Prep/cook/total time where the source provides it.
- Nutrition derived from a traceable food-composition source, not guessed numbers.
- No placeholders, spam, broken directions, or duplicate recipes.

## Quality gate

Default minimum score: `0.82`.

A candidate is rejected when it fails the minimum score, has placeholder/spam text, duplicates an existing recipe, or comes from a source whose production license has not been verified.

## Source policy

Production sources must have a documented license/permission allowing reuse and modification. The pipeline stores source name, URL, license, attribution, and source recipe ID for every imported recipe.

Current intended production sources:

- Wikibooks Cookbook — CC BY-SA 4.0; attribution and share-alike requirements must be preserved.
- USDA FoodData Central — CC0 1.0 for nutrition data.

Research/development-only datasets remain blocked from production until their underlying rights are verified.

## Images

Recipe images are intentionally decoupled from recipe records. Each recipe may later receive four optimized images: one final dish image and three key cooking-stage images. The mobile/web delivery target is a small WebP/AVIF asset, with a hard target of about 60 KB per image where visual quality remains acceptable.
