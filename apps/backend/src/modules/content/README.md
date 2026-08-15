# Global content and recommendations

This module separates **content quality** from **recommendation relevance**.

The catalog is intentionally global: a recipe can have an origin country, cuisine(s), regions/countries where it is culturally common, nutrition/diet tags, ingredients, and licensed media metadata. A user should not receive random global content simply because it exists in the catalog.

Recommendation priority is:

1. Explicit likes and dislikes.
2. Cuisine and cultural fit.
3. Local context and origin/background affinity.
4. Foods already available at home.
5. Nutrition and dietary goals.
6. Skill/time/equipment fit.
7. Controlled exploration so recommendations do not become repetitive.

The catalog contract requires source and license metadata for image/video assets. This is deliberate: media should not be copied into the product without a traceable reuse basis.

The next ingestion phase should populate the catalog at scale (initial target: 500+ recipes and 500+ exercises, with a larger architecture than the initial seed) rather than hard-code content into UI components.
