const fs = require("fs");
const path = require('path');

const inputFilePath = path.join(__dirname, 'study_buddy.json');
const outputFilePath = path.join(__dirname, 'study_data.json');

const linkMap = {
    "M1-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "M1-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "M1-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "M1-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "M1-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CHEMISTRY-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CHEMISTRY-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CHEMISTRY-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CHEMISTRY-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CHEMISTRY-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "BCME-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "BCME-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "BCME-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "BCME-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "BCME-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "ENGLISH-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "ENGLISH-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "ENGLISH-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "ENGLISH-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "ENGLISH-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CP-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CP-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CP-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CP-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CP-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "IT WORK SHOP-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "IT WORK SHOP-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "IT WORK SHOP-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "IT WORK SHOP-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "IT WORK SHOP-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CHEMISTRY LAB-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CHEMISTRY LAB-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CHEMISTRY LAB-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CHEMISTRY LAB-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CHEMISTRY LAB-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "ENGINEERING WORKSHOP-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "ENGINEERING WORKSHOP-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "ENGINEERING WORKSHOP-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "ENGINEERING WORKSHOP-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "ENGINEERING WORKSHOP-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CP LAB-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CP LAB-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CP LAB-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CP LAB-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CP LAB-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "YOGA & SPORTS-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "YOGA & SPORTS-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "YOGA & SPORTS-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "YOGA & SPORTS-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "YOGA & SPORTS-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "M2-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "M2-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "M2-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "M2-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "M2-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "PHYSICS-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "PHYSICS-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "PHYSICS-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "PHYSICS-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "PHYSICS-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "BEEE-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "BEEE-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "BEEE-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "BEEE-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "BEEE-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CS LAB-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CS LAB-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CS LAB-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CS LAB-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "CS LAB-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "EG-DRAWING-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "EG-DRAWING-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "EG-DRAWING-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "EG-DRAWING-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "EG-DRAWING-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "PHYSICS LAB-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "PHYSICS LAB-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "PHYSICS LAB-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "PHYSICS LAB-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "PHYSICS LAB-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "BEEE LAB-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "BEEE LAB-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "BEEE LAB-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "BEEE LAB-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "BEEE LAB-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "DS-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "DS-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "DS-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "DS-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "DS-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "DS LAB-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "DS LAB-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "DS LAB-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "DS LAB-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "DS LAB-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "NSS-1.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "NSS-2.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "NSS-3.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "NSS-4.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing",
    "NSS-5.pdf": "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing"
  
  
  
};

function updatePdfLinks(data) {
  return data.map(obj => {
    if ("subject" in obj && "unit" in obj) {
      const subject = obj.subject.toUpperCase().replace(/ /g, '_');
      const unitMatch = obj.unit.match(/\d+/);
      const unit = unitMatch ? unitMatch[0] : "";

      // Special cases for subjects with spaces
      let prefix;
      if (subject.includes("IT_WORK_SHOP")) prefix = "ITWS";
      else if (subject.includes("ENGINEERING_WORKSHOP")) prefix = "WORKSHOP";
      else if (subject.includes("CP_LAB")) prefix = "CPLAB";
      else if (subject.includes("CHEMISTRY_LAB")) prefix = "CHEMLAB";
      else if (subject.includes("BEEE_LAB")) prefix = "BEEELAB";
      else if (subject.includes("DS_LAB")) prefix = "DSLAB";
      else if (subject.includes("CS_LAB")) prefix = "CSLAB";
      else if (subject.includes("YOGA_&_SPORTS")) prefix = "SPORTS";
      else if (subject.includes("EG-DRAWING")) prefix = "EG";
      else {
        // For normal subjects, take the first part before any special characters
        prefix = subject.split(/[^A-Z]/)[0];
      }

      const key = `${prefix}-${unit}.pdf`;
      
      if (linkMap[key]) {
        return { ...obj, link: linkMap[key] };
      } else {
        console.warn(`⚠️ No link found for: ${key}`);
        return { ...obj, link: "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing" };
      }
    }
    return obj;
  });
}



// Read -> Update -> Write
fs.readFile(inputFilePath, "utf8", (err, content) => {
  if (err) {
    console.error("❌ Error reading input file:", err);
    return;
  }

  try {
    const jsonData = JSON.parse(content);
    const updatedData = updatePdfLinks(jsonData);
    
    fs.writeFile(outputFilePath, JSON.stringify(updatedData, null, 2), (err) => {
      if (err) {
        console.error("❌ Error writing updated data:", err);
        return;
      }
      console.log("✅ PDF links updated successfully! Saved as", outputFilePath);
    });
  } catch (parseErr) {
    console.error("❌ Error parsing JSON:", parseErr);
  }
});