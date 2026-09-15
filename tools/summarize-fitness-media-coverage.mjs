#!/usr/bin/env node

/**
 * Summarize rights-reviewed fitness media candidates by canonical exercise.
 *
 * This is reporting only. It never approves media or grants rights.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const rightsPath = path.resolve(process.argv[2] ?? 'data/fitness-media-video-rights-review.generated.json');
const exercisePath = path.resolve(process.argv[3] ?? 'data/fitness-free-video-queries.sample.json');
const outputPath = path.resolve(process.argv[4] ?? 'data/fitness-media-coverage.generated.json');

function pct(value, total) {
  return total ? Number(((value / total) * 100).toFixed(1)) : 0;
}

const rights = JSON.parse(await fs.readFile(rightsPath, 'utf8'));
const exercises = JSON.parse(await fs.readFile(exercisePath, 'utf8'));
if (!Array.isArray(rights?.results)) throw new Error('Invalid rights-review JSON: results must be an array');
if (!Array.isArray(exercises)) throw new Error('Invalid exercise query JSON: expected an array');

const byExercise = new Map();
for (const exercise of exercises) {
  if (!exercise?.exerciseId) continue;
  byExercise.set(exercise.exerciseId, {
    exerciseId: exercise.exerciseId,
    name: exercise.name ?? exercise.exerciseId,
    candidateCount: 0,
    fetchedCount: 0,
    openLicenseStrong: 0,
    publicDomainCandidate: 0,
    commercialLicenseLead: 0,
    shareAlikeReview: 0,
    noDerivativesReview: 0,
    nonCommercialBlocked: 0,
    blockedPlatform: 0,
    rightsReviewRequired: 0,
    eligibleForManualApproval: 0,
  });
}

const unmapped = {
  candidateCount: 0,
  fetchedCount: 0,
  openLicenseStrong: 0,
  publicDomainCandidate: 0,
  commercialLicenseLead: 0,
  shareAlikeReview: 0,
  noDerivativesReview: 0,
  nonCommercialBlocked: 0,
  blockedPlatform: 0,
  rightsReviewRequired: 0,
  eligibleForManualApproval: 0,
};

for (const candidate of rights.results) {
  const target = byExercise.get(candidate.exerciseId) ?? unmapped;
  target.candidateCount += 1;
  if (candidate.rightsEvidence?.sourcePageFetched) target.fetchedCount += 1;
  if (candidate.bucket === 'open-license-strong') target.openLicenseStrong += 1;
  if (candidate.bucket === 'public-domain-candidate') target.publicDomainCandidate += 1;
  if (candidate.bucket === 'commercial-license-lead') target.commercialLicenseLead += 1;
  if (candidate.bucket === 'sharealike-review') target.shareAlikeReview += 1;
  if (candidate.bucket === 'no-derivatives-review') target.noDerivativesReview += 1;
  if (candidate.bucket === 'noncommercial-blocked') target.nonCommercialBlocked += 1;
  if (candidate.bucket === 'blocked-platform') target.blockedPlatform += 1;
  if (candidate.bucket === 'rights-review-required') target.rightsReviewRequired += 1;
  if (candidate.approval === 'eligible-for-manual-approval') target.eligibleForManualApproval += 1;
}

const rows = [...byExercise.values()].map((row) => ({
  ...row,
  hasCandidates: row.candidateCount > 0,
  hasStrongRightsEvidence: row.openLicenseStrong + row.publicDomainCandidate > 0,
  hasCommercialLead: row.commercialLicenseLead > 0,
  needsMoreDiscovery: row.candidateCount === 0,
  pageFetchSuccessRate: pct(row.fetchedCount, row.candidateCount),
}));

const coveredExercises = rows.filter((row) => row.hasCandidates).length;
const exercisesWithStrongRightsEvidence = rows.filter((row) => row.hasStrongRightsEvidence).length;
const exercisesWithCommercialLeads = rows.filter((row) => row.hasCommercialLead).length;
const gaps = rows.filter((row) => row.needsMoreDiscovery).map((row) => ({ exerciseId: row.exerciseId, name: row.name }));

const bucketTotals = {
  openLicenseStrong: rights.summary?.openLicenseStrong ?? rights.results.filter((x) => x.bucket === 'open-license-strong').length,
  publicDomainCandidates: rights.summary?.publicDomainCandidates ?? rights.results.filter((x) => x.bucket === 'public-domain-candidate').length,
  commercialLicenseLeads: rights.summary?.commercialLicenseLeads ?? rights.results.filter((x) => x.bucket === 'commercial-license-lead').length,
  shareAlikeReview: rights.summary?.shareAlikeReview ?? rights.results.filter((x) => x.bucket === 'sharealike-review').length,
  noDerivativesReview: rights.summary?.noDerivativesReview ?? rights.results.filter((x) => x.bucket === 'no-derivatives-review').length,
  nonCommercialBlocked: rights.summary?.nonCommercialBlocked ?? rights.results.filter((x) => x.bucket === 'noncommercial-blocked').length,
  blockedPlatform: rights.summary?.blockedPlatform ?? rights.results.filter((x) => x.bucket === 'blocked-platform').length,
  rightsReviewRequired: rights.summary?.rightsReviewRequired ?? rights.results.filter((x) => x.bucket === 'rights-review-required').length,
};

const output = {
  generatedAt: new Date().toISOString(),
  inputRightsFile: path.basename(rightsPath),
  inputExerciseFile: path.basename(exercisePath),
  exerciseCount: rows.length,
  reviewedCandidateCount: rights.results.length,
  coveredExerciseCount: coveredExercises,
  coveredExerciseRate: pct(coveredExercises, rows.length),
  exercisesWithStrongRightsEvidence,
  strongRightsEvidenceRate: pct(exercisesWithStrongRightsEvidence, rows.length),
  exercisesWithCommercialLeads,
  commercialLeadExerciseRate: pct(exercisesWithCommercialLeads, rows.length),
  gaps,
  unmapped,
  bucketTotals,
  rows: rows.sort((a, b) => {
    if (a.hasStrongRightsEvidence !== b.hasStrongRightsEvidence) return Number(b.hasStrongRightsEvidence) - Number(a.hasStrongRightsEvidence);
    if (a.hasCommercialLead !== b.hasCommercialLead) return Number(b.hasCommercialLead) - Number(a.hasCommercialLead);
    return b.candidateCount - a.candidateCount;
  }),
  note: 'Coverage here means discovered/reviewed candidates mapped to canonical exercises. It is not production approval. Strong-rights evidence still requires exact asset-level license scope, attribution, commercial-use, hosting/redistribution, and ownership verification.',
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

console.log(`Wrote ${outputPath}`);
console.log(`Covered exercises: ${coveredExercises}/${rows.length} (${output.coveredExerciseRate}%)`);
console.log(`Exercises with strong rights evidence: ${exercisesWithStrongRightsEvidence}/${rows.length}`);
console.log(`Exercises with commercial leads: ${exercisesWithCommercialLeads}/${rows.length}`);
console.log(`Discovery gaps: ${gaps.length}`);
console.log(`Reviewed candidates: ${rights.results.length}`);
console.log(`Open-license strong: ${bucketTotals.openLicenseStrong}`);
console.log(`Public-domain candidates: ${bucketTotals.publicDomainCandidates}`);
console.log(`Commercial-license leads: ${bucketTotals.commercialLicenseLeads}`);
console.log(`Blocked platforms: ${bucketTotals.blockedPlatform}`);
console.log(`Rights review required: ${bucketTotals.rightsReviewRequired}`);
