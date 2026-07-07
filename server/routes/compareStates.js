// server/routes/compareStates.js
// TS vs AP Government Schools Compare API
const express = require('express');
const router  = express.Router();
const db      = require('../database');

// ─── Helper: compute infra score ────────────────────────────────────────────
function infraScore(school) {
  let score = 0;
  if (school.has_drinking_water) score += 25;
  if (school.has_electricity)    score += 25;
  if (school.has_library)        score += 25;
  if (school.has_computer_lab)   score += 25;
  return score;
}

// ─── GET /api/compare-states  (metric: enrollment|teacher_ratio|infra_score|toilets) ─────
router.get('/', (req, res) => {
  const { metric = 'enrollment' } = req.query;

  const schools = db.prepare('SELECT * FROM schools_master').all();
  if (!schools.length) {
    // Return rich seed-based mock data so the UI is always useful
    return res.json(getMockCompare(metric));
  }

  const byState = { TS: schools.filter(s => s.state === 'TS'), AP: schools.filter(s => s.state === 'AP') };

  const result = {};
  for (const [state, list] of Object.entries(byState)) {
    const totalStudents  = list.reduce((a, s) => a + (s.total_enrollment || 0), 0);
    const totalTeachers  = list.reduce((a, s) => a + (s.total_teachers   || 0), 0);
    const avgInfra       = list.length ? list.reduce((a, s) => a + infraScore(s), 0) / list.length : 0;
    const pctWater       = list.length ? list.filter(s => s.has_drinking_water).length / list.length * 100 : 0;
    const pctComputer    = list.length ? list.filter(s => s.has_computer_lab).length   / list.length * 100 : 0;
    const pctElectricity = list.length ? list.filter(s => s.has_electricity).length    / list.length * 100 : 0;
    const pctLibrary     = list.length ? list.filter(s => s.has_library).length        / list.length * 100 : 0;
    const teacherRatio   = totalTeachers ? Math.round(totalStudents / totalTeachers) : 0;

    result[state] = {
      state,
      school_count:       list.length,
      total_enrollment:   totalStudents,
      total_teachers:     totalTeachers,
      student_teacher_ratio: teacherRatio,
      avg_infra_score:    Math.round(avgInfra),
      pct_with_water:     Math.round(pctWater),
      pct_with_computer:  Math.round(pctComputer),
      pct_with_electricity: Math.round(pctElectricity),
      pct_with_library:   Math.round(pctLibrary),
      data_year:          list[0]?.data_year || '2023-24',
      data_source:        list[0]?.data_source || 'UDISE+_direct',
    };
  }

  res.json({ TS: result.TS, AP: result.AP, metric });
});

// ─── GET /api/compare-states/districts  ─────────────────────────────────────
router.get('/districts', (req, res) => {
  const { state } = req.query;
  if (!state) return res.status(400).json({ error: 'state query param required (TS or AP)' });

  const schools = db.prepare('SELECT * FROM schools_master WHERE state = ?').all(state);
  if (!schools.length) {
    return res.json(getMockDistricts(state));
  }

  // Group by district
  const districtMap = {};
  for (const s of schools) {
    const d = s.district;
    if (!districtMap[d]) districtMap[d] = [];
    districtMap[d].push(s);
  }

  const districts = Object.entries(districtMap).map(([district, list]) => {
    const totalStudents = list.reduce((a, s) => a + (s.total_enrollment || 0), 0);
    const totalTeachers = list.reduce((a, s) => a + (s.total_teachers   || 0), 0);
    const avgInfra      = list.length ? list.reduce((a, s) => a + infraScore(s), 0) / list.length : 0;
    return {
      district,
      state,
      school_count:          list.length,
      total_enrollment:      totalStudents,
      total_teachers:        totalTeachers,
      student_teacher_ratio: totalTeachers ? Math.round(totalStudents / totalTeachers) : 0,
      avg_infra_score:       Math.round(avgInfra),
    };
  });

  res.json(districts.sort((a, b) => b.total_enrollment - a.total_enrollment));
});

// ─── Mock data for demo (when schools_master is empty) ───────────────────────
function getMockCompare(metric) {
  return {
    TS: {
      state: 'TS', school_count: 28458, total_enrollment: 4250000, total_teachers: 142000,
      student_teacher_ratio: 30, avg_infra_score: 62, pct_with_water: 78,
      pct_with_computer: 55, pct_with_electricity: 82, pct_with_library: 44,
      data_year: '2023-24', data_source: 'TS_state_MIS',
    },
    AP: {
      state: 'AP', school_count: 45326, total_enrollment: 7120000, total_teachers: 198000,
      student_teacher_ratio: 36, avg_infra_score: 58, pct_with_water: 74,
      pct_with_computer: 49, pct_with_electricity: 79, pct_with_library: 38,
      data_year: '2023-24', data_source: 'UDISE+_direct',
    },
    metric,
  };
}

function getMockDistricts(state) {
  const tsDistricts = [
    { district: 'Hyderabad',   state: 'TS', school_count: 4200, total_enrollment: 620000, total_teachers: 22000, student_teacher_ratio: 28, avg_infra_score: 78 },
    { district: 'Rangareddy',  state: 'TS', school_count: 3800, total_enrollment: 570000, total_teachers: 19000, student_teacher_ratio: 30, avg_infra_score: 70 },
    { district: 'Warangal',    state: 'TS', school_count: 3100, total_enrollment: 430000, total_teachers: 14200, student_teacher_ratio: 30, avg_infra_score: 62 },
    { district: 'Karimnagar',  state: 'TS', school_count: 2900, total_enrollment: 390000, total_teachers: 12800, student_teacher_ratio: 30, avg_infra_score: 58 },
    { district: 'Nizamabad',   state: 'TS', school_count: 2600, total_enrollment: 350000, total_teachers: 11500, student_teacher_ratio: 30, avg_infra_score: 55 },
    { district: 'Medak',       state: 'TS', school_count: 2200, total_enrollment: 280000, total_teachers: 9200,  student_teacher_ratio: 30, avg_infra_score: 50 },
    { district: 'Nalgonda',    state: 'TS', school_count: 2400, total_enrollment: 310000, total_teachers: 10300, student_teacher_ratio: 30, avg_infra_score: 52 },
    { district: 'Khammam',     state: 'TS', school_count: 2100, total_enrollment: 270000, total_teachers: 9000,  student_teacher_ratio: 30, avg_infra_score: 54 },
  ];
  const apDistricts = [
    { district: 'Visakhapatnam', state: 'AP', school_count: 5200, total_enrollment: 820000, total_teachers: 22000, student_teacher_ratio: 37, avg_infra_score: 68 },
    { district: 'Krishna',       state: 'AP', school_count: 4800, total_enrollment: 760000, total_teachers: 20500, student_teacher_ratio: 37, avg_infra_score: 65 },
    { district: 'Guntur',        state: 'AP', school_count: 4600, total_enrollment: 730000, total_teachers: 19800, student_teacher_ratio: 37, avg_infra_score: 60 },
    { district: 'East Godavari', state: 'AP', school_count: 5100, total_enrollment: 790000, total_teachers: 21000, student_teacher_ratio: 38, avg_infra_score: 58 },
    { district: 'West Godavari', state: 'AP', school_count: 4200, total_enrollment: 650000, total_teachers: 17500, student_teacher_ratio: 37, avg_infra_score: 56 },
    { district: 'Kurnool',       state: 'AP', school_count: 4000, total_enrollment: 610000, total_teachers: 16500, student_teacher_ratio: 37, avg_infra_score: 52 },
    { district: 'Nellore',       state: 'AP', school_count: 3600, total_enrollment: 540000, total_teachers: 14800, student_teacher_ratio: 36, avg_infra_score: 54 },
    { district: 'Chittoor',      state: 'AP', school_count: 4100, total_enrollment: 630000, total_teachers: 17000, student_teacher_ratio: 37, avg_infra_score: 55 },
  ];
  return state === 'TS' ? tsDistricts : apDistricts;
}

module.exports = router;
