const { v4: uuidv4 } = require('uuid');

// ─── In-memory data store (replace with DB in production) ────────────────────

let wards = [
  {
    ward_id: 'ward_1',
    name: 'Kukatpally',
    population: 58000,
    literacy_rate: 72,
    youth_population: 14200,
    school_age_population: 9800,
    unemployment_rate: 14.5,
  },
  {
    ward_id: 'ward_2',
    name: 'KPHB Colony',
    population: 42000,
    literacy_rate: 78,
    youth_population: 10500,
    school_age_population: 7100,
    unemployment_rate: 11.2,
  },
  {
    ward_id: 'ward_3',
    name: 'Nizampet',
    population: 35000,
    literacy_rate: 65,
    youth_population: 9000,
    school_age_population: 6200,
    unemployment_rate: 17.8,
  },
];

let projects = [
  {
    project_id: 'proj_1',
    project_name: 'Kukatpally Government High School Upgrade',
    project_type: 'school_upgrade',
    ward_id: 'ward_1',
    ward_name: 'Kukatpally',
    lat: 17.4948,
    lng: 78.3996,
    cost_estimate: 4200000,
    proposed_capacity: 800,
    enrollment: 1150,
    capacity: 600,
    distance_penalty: 3.2,
    existing_seats: null,
    description: 'Upgrade aging school infrastructure to accommodate growing student population with new classrooms and labs.',
  },
  {
    project_id: 'proj_2',
    project_name: 'Kukatpally Vocational Training Centre',
    project_type: 'vocational_centre',
    ward_id: 'ward_1',
    ward_name: 'Kukatpally',
    lat: 17.502,
    lng: 78.405,
    cost_estimate: 6800000,
    proposed_capacity: 500,
    enrollment: null,
    capacity: null,
    distance_penalty: 2.8,
    existing_seats: 150,
    description: 'New vocational centre offering IT, construction, and hospitality training for unemployed youth.',
  },
  {
    project_id: 'proj_3',
    project_name: 'KPHB Primary School Expansion',
    project_type: 'school_upgrade',
    ward_id: 'ward_2',
    ward_name: 'KPHB Colony',
    lat: 17.4878,
    lng: 78.3877,
    cost_estimate: 2900000,
    proposed_capacity: 600,
    enrollment: 920,
    capacity: 550,
    distance_penalty: 2.1,
    existing_seats: null,
    description: 'Expand existing primary school to address surge in enrollment from new residential development.',
  },
  {
    project_id: 'proj_4',
    project_name: 'KPHB Skills Development Hub',
    project_type: 'vocational_centre',
    ward_id: 'ward_2',
    ward_name: 'KPHB Colony',
    lat: 17.491,
    lng: 78.392,
    cost_estimate: 5100000,
    proposed_capacity: 400,
    enrollment: null,
    capacity: null,
    distance_penalty: 1.8,
    existing_seats: 180,
    description: 'Modern skills development hub with industry partnerships for job-ready training programs.',
  },
  {
    project_id: 'proj_5',
    project_name: 'Nizampet Model School Renovation',
    project_type: 'school_upgrade',
    ward_id: 'ward_3',
    ward_name: 'Nizampet',
    lat: 17.5138,
    lng: 78.3762,
    cost_estimate: 3600000,
    proposed_capacity: 700,
    enrollment: 1050,
    capacity: 500,
    distance_penalty: 4.1,
    existing_seats: null,
    description: 'Complete renovation of dilapidated model school building with modern amenities.',
  },
  {
    project_id: 'proj_6',
    project_name: 'Nizampet Rural Vocational Institute',
    project_type: 'vocational_centre',
    ward_id: 'ward_3',
    ward_name: 'Nizampet',
    lat: 17.518,
    lng: 78.371,
    cost_estimate: 7500000,
    proposed_capacity: 600,
    enrollment: null,
    capacity: null,
    distance_penalty: 4.5,
    existing_seats: 80,
    description: 'Rural vocational institute focused on agriculture tech, renewable energy, and local trades.',
  },
];

const submissionTexts = [
  'The school near sector 4 is extremely overcrowded. My children share books because there are not enough.',
  'No vocational training available for youth in our area. Many young people are sitting idle and getting into bad activities.',
  'School building is 40 years old. Roof leaks during monsoons. Teachers refuse to come in rain.',
  'We need a skills center here. I traveled 12km to attend welding training and still could not get a seat.',
  'My son failed to get admission in government school because all seats were taken months ago.',
  'The existing vocational institute is too far and expensive to reach daily. Please build one nearby.',
  'Classrooms are split into two with curtains. 80 students per teacher is not education, it is chaos.',
  'Youth unemployment is huge problem. After 10th standard, no path for technical skill training nearby.',
  'School toilets are broken and unsafe, especially for girl children. Enrollment is dropping because of this.',
  'We formed a local committee and found 400 youth who need skills training. There is no facility within 8km.',
  'Government school has only 4 teachers for 600 students. We desperately need better infrastructure.',
  'The walk to school is dangerous, crossing a busy highway. A school upgrade with safe access is needed.',
  'My daughter stopped going to school because she was embarrassed by the broken chairs and flooding classrooms.',
  'Three wards share one small vocational centre. By the time we register, seats are gone.',
  'School library has not had new books in over a decade. Children have no motivation to study.',
  'I have a diploma but cannot find work. Need job-linking programs tied to the vocational centre.',
  'Parents in our neighborhood collected money for basic school repairs. Government should take responsibility.',
  'Online training is not an option for us. We need physical centers with equipment and mentors.',
  'Children from our ward travel 6km to the nearest school. School upgrade here will change everything.',
  'Vocational training helped my cousin get a job in 3 months. We need the same opportunity in our area.',
];

let submissions = submissionTexts.map((text, i) => {
  const wardIdx = i % 3;
  const wardIds = ['ward_1', 'ward_2', 'ward_3'];
  const wardNames = ['Kukatpally', 'KPHB Colony', 'Nizampet'];
  const types = ['school_upgrade', 'vocational_centre'];
  const lats = [17.4948, 17.4878, 17.5138];
  const lngs = [78.3996, 78.3877, 78.3762];

  return {
    submission_id: uuidv4(),
    name: i % 3 === 0 ? `Resident ${i + 1}` : null,
    ward_id: wardIds[wardIdx],
    ward_name: wardNames[wardIdx],
    complaint_text: text,
    project_type_suggested: types[i % 2],
    lat: lats[wardIdx] + (Math.random() - 0.5) * 0.02,
    lng: lngs[wardIdx] + (Math.random() - 0.5) * 0.02,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
});

module.exports = { wards, projects, submissions };
