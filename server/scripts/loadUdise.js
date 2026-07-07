// schools_master table + CSV loader script
const Database = require('better-sqlite3');
const path = require('path');
const csv  = require('csv-parser');
const fs   = require('fs');

const db = new Database(path.join(__dirname, '..', 'data.db'));

// ─── Create schools_master table ─────────────────────────────────────────────
db.exec(`
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
`);

const insertSchool = db.prepare(`
  INSERT OR REPLACE INTO schools_master 
    (udise_code, school_name, state, district, block, school_category, management_type,
     total_enrollment, total_teachers, classrooms, toilets_boys, toilets_girls,
     has_drinking_water, has_electricity, has_library, has_computer_lab, lat, lng, data_year, data_source)
  VALUES 
    (@udise_code, @school_name, @state, @district, @block, @school_category, @management_type,
     @total_enrollment, @total_teachers, @classrooms, @toilets_boys, @toilets_girls,
     @has_drinking_water, @has_electricity, @has_library, @has_computer_lab, @lat, @lng, @data_year, @data_source)
`);

function loadCSV(filePath, state, dataYear, dataSource) {
  if (!fs.existsSync(filePath)) {
    console.warn(`CSV file not found: ${filePath}`);
    return;
  }

  const rows = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      rows.push({
        udise_code:         row.udise_code || row.UDISE_CODE,
        school_name:        row.school_name || row.SCHOOL_NAME,
        state,
        district:           row.district_name || row.DISTRICT,
        block:              row.block_name || row.BLOCK,
        school_category:    row.school_category || row.SCHOOL_CATEGORY || '',
        management_type:    row.management || row.MANAGEMENT || '',
        total_enrollment:   parseInt(row.total_enrollment) || 0,
        total_teachers:     parseInt(row.total_teachers)   || 0,
        classrooms:         parseInt(row.classrooms)       || 0,
        toilets_boys:       parseInt(row.toilets_boys)     || 0,
        toilets_girls:      parseInt(row.toilets_girls)    || 0,
        has_drinking_water: (row.drinking_water === 'Yes' || row.drinking_water === '1') ? 1 : 0,
        has_electricity:    (row.electricity    === 'Yes' || row.electricity    === '1') ? 1 : 0,
        has_library:        (row.library        === 'Yes' || row.library        === '1') ? 1 : 0,
        has_computer_lab:   (row.computer_lab   === 'Yes' || row.computer_lab   === '1') ? 1 : 0,
        lat:                parseFloat(row.latitude)  || null,
        lng:                parseFloat(row.longitude) || null,
        data_year:          dataYear,
        data_source:        dataSource,
      });
    })
    .on('end', () => {
      const insertMany = db.transaction((rows) => rows.forEach(r => insertSchool.run(r)));
      insertMany(rows);
      console.log(`✅ Loaded ${rows.length} schools for ${state} from ${filePath}`);
      
      // Validation
      const { school_count } = db.prepare('SELECT COUNT(*) as school_count FROM schools_master WHERE state = ?').get(state);
      console.log(`   → Total schools for ${state} in DB: ${school_count}`);
    })
    .on('error', (err) => console.error('CSV parse error:', err));
}

// ─── Usage: node loadUdise.js ─────────────────────────────────────────────────
const AP_CSV = path.join(__dirname, '..', 'data', 'ap_schools.csv');
const TS_CSV = path.join(__dirname, '..', 'data', 'ts_schools.csv');

loadCSV(AP_CSV, 'AP', '2023-24', 'UDISE+_direct');
loadCSV(TS_CSV, 'TS', '2023-24', 'TS_state_MIS');
