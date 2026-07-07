/**
 * Demand and Priority Scoring Utilities
 */

function schoolDemandScore({ enrollment, capacity, schoolAgePopulation, distancePenalty }) {
  const enrollmentGap = enrollment - capacity;
  return enrollmentGap * 0.4 + (schoolAgePopulation / 1000) * 0.3 + distancePenalty * 0.3;
}

function vocationalDemandScore({ youthPopulation, existingSeats, distancePenalty, unemploymentRate }) {
  const youthUnmet = youthPopulation - existingSeats;
  return youthUnmet * 0.5 + distancePenalty * 0.3 + unemploymentRate * 0.2;
}

function finalPriority(demandScoreNormalized, costPerBeneficiaryNormalizedInverse) {
  return demandScoreNormalized * 0.6 + costPerBeneficiaryNormalizedInverse * 0.4;
}

/**
 * Normalize an array of values to [0, 1] range
 */
function normalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

/**
 * Calculate scored and ranked projects
 * @param {Array} projects - raw project records
 * @param {Array} demographics - ward demographics
 * @returns {Array} enriched projects with scores
 */
function scoreAndRankProjects(projects, demographics) {
  const demandScores = projects.map((p) => {
    const ward = demographics.find((d) => d.ward_id === p.ward_id) || {};

    if (p.project_type === 'school_upgrade') {
      return schoolDemandScore({
        enrollment: p.enrollment || 800,
        capacity: p.capacity || 600,
        schoolAgePopulation: ward.school_age_population || 5000,
        distancePenalty: p.distance_penalty || 2,
      });
    } else {
      return vocationalDemandScore({
        youthPopulation: ward.youth_population || 8000,
        existingSeats: p.existing_seats || 200,
        distancePenalty: p.distance_penalty || 2,
        unemploymentRate: ward.unemployment_rate || 12,
      });
    }
  });

  const costPerBeneficiary = projects.map((p) => {
    const beneficiaries = p.proposed_capacity || 500;
    return p.cost_estimate / beneficiaries;
  });

  const normalizedDemand = normalize(demandScores);
  const normalizedCostInverse = normalize(costPerBeneficiary).map((v) => 1 - v);

  const scored = projects.map((p, i) => ({
    ...p,
    demand_score: parseFloat(demandScores[i].toFixed(2)),
    cost_per_beneficiary: parseFloat(costPerBeneficiary[i].toFixed(2)),
    demand_score_normalized: parseFloat(normalizedDemand[i].toFixed(4)),
    cost_per_beneficiary_normalized_inverse: parseFloat(normalizedCostInverse[i].toFixed(4)),
    final_priority: parseFloat(finalPriority(normalizedDemand[i], normalizedCostInverse[i]).toFixed(4)),
  }));

  return scored.sort((a, b) => b.final_priority - a.final_priority).map((p, i) => ({ ...p, rank: i + 1 }));
}

module.exports = { schoolDemandScore, vocationalDemandScore, finalPriority, scoreAndRankProjects };
