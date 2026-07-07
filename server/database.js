const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ─── Open / create database file ─────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Core Schema ─────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS wards (
    ward_id               TEXT PRIMARY KEY,
    name                  TEXT NOT NULL,
    population            INTEGER DEFAULT 0,
    literacy_rate         REAL    DEFAULT 0,
    youth_population      INTEGER DEFAULT 0,
    school_age_population INTEGER DEFAULT 0,
    unemployment_rate     REAL    DEFAULT 0,
    state                 TEXT    DEFAULT 'TS',
    district              TEXT    DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS projects (
    project_id          TEXT PRIMARY KEY,
    project_name        TEXT NOT NULL,
    project_type        TEXT NOT NULL,
    ward_id             TEXT NOT NULL,
    ward_name           TEXT,
    lat                 REAL,
    lng                 REAL,
    cost_estimate       REAL    DEFAULT 0,
    proposed_capacity   INTEGER DEFAULT 0,
    enrollment          INTEGER,
    capacity            INTEGER,
    distance_penalty    REAL    DEFAULT 2,
    existing_seats      INTEGER,
    description         TEXT    DEFAULT '',
    state               TEXT    DEFAULT 'TS',
    created_at          TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (ward_id) REFERENCES wards(ward_id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    submission_id           TEXT PRIMARY KEY,
    name                    TEXT,
    ward_id                 TEXT,
    ward_name               TEXT,
    complaint_text          TEXT NOT NULL,
    project_type_suggested  TEXT,
    lat                     REAL,
    lng                     REAL,
    timestamp               TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS local_news (
    news_id     TEXT PRIMARY KEY,
    state       TEXT NOT NULL,
    district    TEXT NOT NULL,
    ward_id     TEXT,
    category    TEXT NOT NULL,
    summary     TEXT NOT NULL,
    source_url  TEXT DEFAULT '',
    fetched_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS schools_master (
    udise_code         TEXT PRIMARY KEY,
    school_name        TEXT NOT NULL,
    state              TEXT NOT NULL,
    district           TEXT,
    block              TEXT,
    school_category    TEXT,
    management_type    TEXT,
    total_enrollment   INTEGER DEFAULT 0,
    total_teachers     INTEGER DEFAULT 0,
    classrooms         INTEGER DEFAULT 0,
    toilets_boys       INTEGER DEFAULT 0,
    toilets_girls      INTEGER DEFAULT 0,
    has_drinking_water INTEGER DEFAULT 0,
    has_electricity    INTEGER DEFAULT 0,
    has_library        INTEGER DEFAULT 0,
    has_computer_lab   INTEGER DEFAULT 0,
    lat                REAL,
    lng                REAL,
    data_year          TEXT DEFAULT '2023-24',
    data_source        TEXT DEFAULT 'UDISE+_direct'
  );

  CREATE TABLE IF NOT EXISTS users (
    user_id       TEXT PRIMARY KEY,
    name          TEXT,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT DEFAULT 'citizen',
    created_at    TEXT DEFAULT (datetime('now'))
  );
`);

// ─── Migrations: safely add columns if they don't exist ──────────────────────
function columnExists(table, col) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === col);
}
if (!columnExists('wards',    'state'))    db.exec("ALTER TABLE wards    ADD COLUMN state    TEXT DEFAULT 'TS'");
if (!columnExists('wards',    'district')) db.exec("ALTER TABLE wards    ADD COLUMN district TEXT DEFAULT ''");
if (!columnExists('projects', 'state'))    db.exec("ALTER TABLE projects ADD COLUMN state    TEXT DEFAULT 'TS'");
if (!columnExists('submissions', 'category'))       db.exec("ALTER TABLE submissions ADD COLUMN category TEXT DEFAULT 'Uncategorized'");
if (!columnExists('submissions', 'priority_score')) db.exec("ALTER TABLE submissions ADD COLUMN priority_score INTEGER DEFAULT 0");
if (!columnExists('submissions', 'priority_level')) db.exec("ALTER TABLE submissions ADD COLUMN priority_level TEXT DEFAULT 'Low'");
if (!columnExists('submissions', 'status'))         db.exec("ALTER TABLE submissions ADD COLUMN status TEXT DEFAULT 'Submitted'");
if (!columnExists('submissions', 'attachment_url')) db.exec("ALTER TABLE submissions ADD COLUMN attachment_url TEXT");
if (!columnExists('submissions', 'user_id'))        db.exec("ALTER TABLE submissions ADD COLUMN user_id TEXT");

// ─── Seed existing (Hyderabad) wards if empty ─────────────────────────────────
const { count: wardCount } = db.prepare('SELECT COUNT(*) as count FROM wards').get();

if (wardCount === 0) {
  console.log('🌱 Seeding database with initial ward/project/submission data...');

  const insertWard = db.prepare(`
    INSERT INTO wards (ward_id, name, population, literacy_rate, youth_population, school_age_population, unemployment_rate, state, district)
    VALUES (@ward_id, @name, @population, @literacy_rate, @youth_population, @school_age_population, @unemployment_rate, @state, @district)
  `);

  // Original Hyderabad wards
  const initialWards = [
    { ward_id: 'ward_1', name: 'Kukatpally',  population: 58000, literacy_rate: 72, youth_population: 14200, school_age_population: 9800,  unemployment_rate: 14.5, state: 'TS', district: 'Hyderabad' },
    { ward_id: 'ward_2', name: 'KPHB Colony', population: 42000, literacy_rate: 78, youth_population: 10500, school_age_population: 7100,  unemployment_rate: 11.2, state: 'TS', district: 'Hyderabad' },
    { ward_id: 'ward_3', name: 'Nizampet',    population: 35000, literacy_rate: 65, youth_population: 9000,  school_age_population: 6200,  unemployment_rate: 17.8, state: 'TS', district: 'Hyderabad' },
  ];
  for (const w of initialWards) insertWard.run(w);

  // Projects
  const insertProject = db.prepare(`
    INSERT INTO projects (project_id, project_name, project_type, ward_id, ward_name, lat, lng, cost_estimate, proposed_capacity, enrollment, capacity, distance_penalty, existing_seats, description, state)
    VALUES (@project_id, @project_name, @project_type, @ward_id, @ward_name, @lat, @lng, @cost_estimate, @proposed_capacity, @enrollment, @capacity, @distance_penalty, @existing_seats, @description, @state)
  `);
  const projects = [
    { project_id: 'proj_1', project_name: 'Kukatpally Government High School Upgrade', project_type: 'school_upgrade',    ward_id: 'ward_1', ward_name: 'Kukatpally',  lat: 17.4948, lng: 78.3996, cost_estimate: 4200000, proposed_capacity: 800, enrollment: 1150, capacity: 600, distance_penalty: 3.2, existing_seats: null, description: 'Upgrade aging school infrastructure to accommodate growing student population with new classrooms and labs.',    state: 'TS' },
    { project_id: 'proj_2', project_name: 'Kukatpally Vocational Training Centre',     project_type: 'vocational_centre', ward_id: 'ward_1', ward_name: 'Kukatpally',  lat: 17.502,  lng: 78.405,  cost_estimate: 6800000, proposed_capacity: 500, enrollment: null, capacity: null, distance_penalty: 2.8, existing_seats: 150,  description: 'New vocational centre offering IT, construction, and hospitality training for unemployed youth.',                  state: 'TS' },
    { project_id: 'proj_3', project_name: 'KPHB Primary School Expansion',             project_type: 'school_upgrade',    ward_id: 'ward_2', ward_name: 'KPHB Colony', lat: 17.4878, lng: 78.3877, cost_estimate: 2900000, proposed_capacity: 600, enrollment: 920,  capacity: 550, distance_penalty: 2.1, existing_seats: null, description: 'Expand existing primary school to address surge in enrollment from new residential development.',                  state: 'TS' },
    { project_id: 'proj_4', project_name: 'KPHB Skills Development Hub',               project_type: 'vocational_centre', ward_id: 'ward_2', ward_name: 'KPHB Colony', lat: 17.491,  lng: 78.392,  cost_estimate: 5100000, proposed_capacity: 400, enrollment: null, capacity: null, distance_penalty: 1.8, existing_seats: 180,  description: 'Modern skills development hub with industry partnerships for job-ready training programs.',                          state: 'TS' },
    { project_id: 'proj_5', project_name: 'Nizampet Model School Renovation',          project_type: 'school_upgrade',    ward_id: 'ward_3', ward_name: 'Nizampet',    lat: 17.5138, lng: 78.3762, cost_estimate: 3600000, proposed_capacity: 700, enrollment: 1050, capacity: 500, distance_penalty: 4.1, existing_seats: null, description: 'Complete renovation of dilapidated model school building with modern amenities.',                                    state: 'TS' },
    { project_id: 'proj_6', project_name: 'Nizampet Rural Vocational Institute',       project_type: 'vocational_centre', ward_id: 'ward_3', ward_name: 'Nizampet',    lat: 17.518,  lng: 78.371,  cost_estimate: 7500000, proposed_capacity: 600, enrollment: null, capacity: null, distance_penalty: 4.5, existing_seats: 80,   description: 'Rural vocational institute focused on agriculture tech, renewable energy, and local trades.',                        state: 'TS' },
  ];
  for (const p of projects) insertProject.run(p);

  // Submissions
  const insertSub = db.prepare(`
    INSERT INTO submissions (submission_id, name, ward_id, ward_name, complaint_text, project_type_suggested, lat, lng, timestamp)
    VALUES (@submission_id, @name, @ward_id, @ward_name, @complaint_text, @project_type_suggested, @lat, @lng, @timestamp)
  `);
  const texts = [
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
  const wardIds = ['ward_1','ward_2','ward_3'];
  const wardNames = ['Kukatpally','KPHB Colony','Nizampet'];
  const types = ['school_upgrade','vocational_centre'];
  const lats = [17.4948,17.4878,17.5138];
  const lngs = [78.3996,78.3877,78.3762];
  for (let i = 0; i < texts.length; i++) {
    const wIdx = i % 3;
    insertSub.run({
      submission_id: uuidv4(), name: i % 3 === 0 ? `Resident ${i+1}` : null,
      ward_id: wardIds[wIdx], ward_name: wardNames[wIdx], complaint_text: texts[i],
      project_type_suggested: types[i % 2],
      lat: lats[wIdx] + (Math.random()-0.5)*0.02, lng: lngs[wIdx] + (Math.random()-0.5)*0.02,
      timestamp: new Date(Date.now() - Math.random()*30*24*60*60*1000).toISOString(),
    });
  }
  console.log('✅ Initial seed complete.');
}

// ─── Seed TS/AP district wards if not present ─────────────────────────────────
const tsApWards = [
  // ── TELANGANA ────────────────────────────────────────────────────────────────
  // Hyderabad & Surroundings
  { ward_id: 'ts_hyd_jh',  name: 'Jubilee Hills',     population: 48000, literacy_rate: 87, youth_population: 11200, school_age_population: 7000,  unemployment_rate: 8.1,  state: 'TS', district: 'Hyderabad'   },
  { ward_id: 'ts_hyd_mp',  name: 'Madhapur',          population: 62000, literacy_rate: 85, youth_population: 18000, school_age_population: 9500,  unemployment_rate: 9.2,  state: 'TS', district: 'Ranga Reddy' },
  { ward_id: 'ts_rr_sha',  name: 'Shamshabad',        population: 52000, literacy_rate: 68, youth_population: 13500, school_age_population: 9200,  unemployment_rate: 16.3, state: 'TS', district: 'Ranga Reddy'  },
  { ward_id: 'ts_rr_kha',  name: 'Kothur',            population: 38000, literacy_rate: 62, youth_population: 10200, school_age_population: 7400,  unemployment_rate: 19.1, state: 'TS', district: 'Ranga Reddy'  },
  // Major Cities
  { ward_id: 'ts_wgl_kaz', name: 'Kazipet',          population: 61000, literacy_rate: 71, youth_population: 15800, school_age_population: 10500, unemployment_rate: 15.7, state: 'TS', district: 'Warangal'    },
  { ward_id: 'ts_wgl_hub', name: 'Hanamkonda',       population: 74000, literacy_rate: 74, youth_population: 18200, school_age_population: 12300, unemployment_rate: 13.4, state: 'TS', district: 'Warangal'    },
  { ward_id: 'ts_wgl_urb', name: 'Warangal Urban',   population: 85000, literacy_rate: 75, youth_population: 20000, school_age_population: 14000, unemployment_rate: 14.1, state: 'TS', district: 'Warangal'    },
  { ward_id: 'ts_kar_urb', name: 'Karimnagar Urban', population: 66000, literacy_rate: 76, youth_population: 16400, school_age_population: 11100, unemployment_rate: 12.8, state: 'TS', district: 'Karimnagar'  },
  { ward_id: 'ts_nzb_urb', name: 'Nizamabad Urban',  population: 55000, literacy_rate: 69, youth_population: 14000, school_age_population: 9600,  unemployment_rate: 17.2, state: 'TS', district: 'Nizamabad'   },
  { ward_id: 'ts_khm_urb', name: 'Khammam Urban',    population: 58000, literacy_rate: 73, youth_population: 15200, school_age_population: 10100, unemployment_rate: 13.9, state: 'TS', district: 'Khammam'     },
  { ward_id: 'ts_nlg_urb', name: 'Nalgonda Urban',   population: 49000, literacy_rate: 68, youth_population: 12500, school_age_population: 8900,  unemployment_rate: 16.5, state: 'TS', district: 'Nalgonda'    },
  { ward_id: 'ts_mbn_urb', name: 'Mahabubnagar',     population: 52000, literacy_rate: 66, youth_population: 13100, school_age_population: 9200,  unemployment_rate: 18.2, state: 'TS', district: 'Mahabubnagar'},
  { ward_id: 'ts_adb_urb', name: 'Adilabad Urban',   population: 43000, literacy_rate: 62, youth_population: 11000, school_age_population: 7800,  unemployment_rate: 21.0, state: 'TS', district: 'Adilabad'    },
  { ward_id: 'ts_sdp_urb', name: 'Siddipet Urban',   population: 47000, literacy_rate: 72, youth_population: 12000, school_age_population: 8500,  unemployment_rate: 15.5, state: 'TS', district: 'Siddipet'    },
  { ward_id: 'ts_mdk_snj', name: 'Sangareddy',       population: 44000, literacy_rate: 63, youth_population: 11500, school_age_population: 8100,  unemployment_rate: 20.5, state: 'TS', district: 'Medak'       },
  
  // ── ANDHRA PRADESH ───────────────────────────────────────────────────────────
  // Visakhapatnam
  { ward_id: 'ap_viz_gaj', name: 'Gajuwaka',         population: 85000, literacy_rate: 72, youth_population: 21000, school_age_population: 14500, unemployment_rate: 13.6, state: 'AP', district: 'Visakhapatnam' },
  { ward_id: 'ap_viz_mvp', name: 'MVP Colony',       population: 62000, literacy_rate: 82, youth_population: 15000, school_age_population: 9800,  unemployment_rate: 9.4,  state: 'AP', district: 'Visakhapatnam' },
  { ward_id: 'ap_viz_urb', name: 'Visakhapatnam Urban', population: 95000, literacy_rate: 84, youth_population: 24000, school_age_population: 16000, unemployment_rate: 10.2, state: 'AP', district: 'Visakhapatnam' },
  // Krishna/NTR (Vijayawada)
  { ward_id: 'ap_krs_vjw', name: 'Vijayawada West',  population: 94000, literacy_rate: 79, youth_population: 23000, school_age_population: 15200, unemployment_rate: 11.3, state: 'AP', district: 'NTR'           },
  { ward_id: 'ap_krs_pat', name: 'Patamata',         population: 57000, literacy_rate: 76, youth_population: 14200, school_age_population: 9300,  unemployment_rate: 12.9, state: 'AP', district: 'NTR'           },
  // Guntur
  { ward_id: 'ap_gnt_urb', name: 'Guntur Urban',     population: 73000, literacy_rate: 74, youth_population: 18500, school_age_population: 12400, unemployment_rate: 14.1, state: 'AP', district: 'Guntur'         },
  { ward_id: 'ap_gnt_tad', name: 'Tadepalli',        population: 49000, literacy_rate: 70, youth_population: 12800, school_age_population: 8700,  unemployment_rate: 16.8, state: 'AP', district: 'Guntur'         },
  // Kurnool
  { ward_id: 'ap_knl_urb', name: 'Kurnool Urban',    population: 69000, literacy_rate: 65, youth_population: 17500, school_age_population: 12000, unemployment_rate: 18.4, state: 'AP', district: 'Kurnool'        },
  { ward_id: 'ap_knl_ndy', name: 'Nandyal',          population: 52000, literacy_rate: 63, youth_population: 13000, school_age_population: 9000,  unemployment_rate: 19.2, state: 'AP', district: 'Kurnool'        },
  // Nellore
  { ward_id: 'ap_nel_urb', name: 'Nellore Urban',    population: 58000, literacy_rate: 70, youth_population: 14500, school_age_population: 9800,  unemployment_rate: 15.6, state: 'AP', district: 'Nellore'        },
  // Godavari Districts
  { ward_id: 'ap_egd_kak', name: 'Kakinada',         population: 79000, literacy_rate: 76, youth_population: 19600, school_age_population: 13100, unemployment_rate: 14.7, state: 'AP', district: 'East Godavari'  },
  { ward_id: 'ap_egd_raj', name: 'Rajamahendravaram',population: 68000, literacy_rate: 75, youth_population: 17000, school_age_population: 11500, unemployment_rate: 13.8, state: 'AP', district: 'East Godavari'  },
  { ward_id: 'ap_wgd_eli', name: 'Eluru',            population: 64000, literacy_rate: 72, youth_population: 16200, school_age_population: 10900, unemployment_rate: 16.2, state: 'AP', district: 'West Godavari'  },
  // Tirupati/Chittoor
  { ward_id: 'ap_ctr_tir', name: 'Tirupati Urban',   population: 88000, literacy_rate: 78, youth_population: 21800, school_age_population: 14600, unemployment_rate: 10.8, state: 'AP', district: 'Tirupati'       },
  { ward_id: 'ap_ctr_urb', name: 'Chittoor Urban',   population: 55000, literacy_rate: 71, youth_population: 13800, school_age_population: 9500,  unemployment_rate: 15.2, state: 'AP', district: 'Chittoor'       },
  // Kadapa / Anantapur
  { ward_id: 'ap_kdp_urb', name: 'Kadapa Urban',     population: 60000, literacy_rate: 68, youth_population: 15000, school_age_population: 10500, unemployment_rate: 17.5, state: 'AP', district: 'YSR Kadapa'     },
  { ward_id: 'ap_atp_urb', name: 'Anantapur Urban',  population: 67000, literacy_rate: 69, youth_population: 16800, school_age_population: 11600, unemployment_rate: 16.9, state: 'AP', district: 'Anantapur'      },
  // Prakasam / Srikakulam / Vizianagaram
  { ward_id: 'ap_prk_ong', name: 'Ongole',           population: 54000, literacy_rate: 71, youth_population: 13500, school_age_population: 9400,  unemployment_rate: 14.8, state: 'AP', district: 'Prakasam'       },
  { ward_id: 'ap_srk_urb', name: 'Srikakulam',       population: 46000, literacy_rate: 65, youth_population: 11500, school_age_population: 8000,  unemployment_rate: 18.1, state: 'AP', district: 'Srikakulam'     },
  { ward_id: 'ap_vzm_urb', name: 'Vizianagaram',     population: 51000, literacy_rate: 67, youth_population: 12800, school_age_population: 8800,  unemployment_rate: 17.4, state: 'AP', district: 'Vizianagaram'   },
];

const insertWardIfMissing = db.prepare(`
  INSERT OR IGNORE INTO wards (ward_id, name, population, literacy_rate, youth_population, school_age_population, unemployment_rate, state, district)
  VALUES (@ward_id, @name, @population, @literacy_rate, @youth_population, @school_age_population, @unemployment_rate, @state, @district)
`);

let seededCount = 0;
for (const w of tsApWards) {
  const info = insertWardIfMissing.run(w);
  if (info.changes > 0) seededCount++;
}
if (seededCount > 0) console.log(`🗺️  Added ${seededCount} TS/AP ward(s) to database.`);

module.exports = db;
