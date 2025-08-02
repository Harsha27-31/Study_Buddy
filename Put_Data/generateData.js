const fs = require('fs');

const selectedBranches = ["CSE", "AIML", "CIC", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "CSIT"];
const firstYearSem1 = ["M1", "CHEMISTRY", "BCME", "ENGLISH", "CP", "IT WORK SHOP", "CHEMISTRY LAB", "ENGINEERING WORKSHOP", "CP LAB", "YOGA & SPORTS"];
const firstYearSem2 = ["M2", "PHYSICS", "BEEE", "CS LAB", "EG-DRAWING", "PHYSICS LAB", "BEEE LAB", "DS", "DS LAB", "NSS"];
const units = ["1st unit", "2nd unit", "3rd unit", "4th unit", "5th unit"];
const addedBy = "64f5f35ce7dcf0c1a8b2d312";

let data = [];

// Shared 1st Year logic for all selectedBranches
selectedBranches.forEach(branch => {
  [
    { year: "1st Year", semester: "1st sem", subjects: firstYearSem1 },
    { year: "1st Year", semester: "2nd sem", subjects: firstYearSem2 }
  ].forEach(entry => {
    entry.subjects.forEach(subject => {
      units.forEach((unit, i) => {
        data.push({
          branch,
          year: entry.year,
          semester: entry.semester,
          subject,
          unit,
          topic: `${subject} - ${unit}`,
          link: "https://drive.google.com/drive/folders/1jY_z1WRndqeUawh99HzyMsRk8y4XwbZN?usp=sharing",
          addedBy
        });
      });
    });
  });
});

// Write to file
fs.writeFileSync('study_buddy.json', JSON.stringify(data, null, 2));
console.log("✅ Data generation completed. File saved as study_buddy.json");
