/* Generates a sample Recall bulk-upload spreadsheet matching the importer's columns
   (see src/lib/bulkQuestions.ts): text, type, explanation, option1, correct1, ... option4, correct4.
   Subject + year are NOT in the sheet — they're set on the recall paper when you create it. */
const XLSX = require("xlsx")
const path = require("path")

const header = [
  "text", "type", "explanation",
  "option1", "correct1", "option2", "correct2", "option3", "correct3", "option4", "correct4",
]

const rows = [
  ["A 45-year-old man presents with massive splenomegaly and a WBC of 150,000/mm3 showing the full spectrum of granulocytes. Which genetic abnormality is most likely?",
    "SINGLE_CHOICE", "t(9;22) — the Philadelphia chromosome (BCR-ABL1) — is characteristic of chronic myeloid leukaemia.",
    "t(9;22)", "TRUE", "t(8;14)", "FALSE", "t(15;17)", "FALSE", "t(14;18)", "FALSE"],

  ["Caseating granulomas are most characteristic of which infection?",
    "SINGLE_CHOICE", "Caseous (cheese-like) necrosis within granulomas is the hallmark of tuberculosis.",
    "Tuberculosis", "TRUE", "Syphilis", "FALSE", "Candidiasis", "FALSE", "Cholera", "FALSE"],

  ["Which of the following are cardinal signs of acute inflammation?",
    "MULTIPLE_CHOICE", "The classic signs are rubor (redness), calor (heat), tumor (swelling), dolor (pain) and loss of function.",
    "Redness", "TRUE", "Heat", "TRUE", "Swelling", "TRUE", "Pallor", "FALSE"],

  ["Reed-Sternberg cells are diagnostic of Hodgkin lymphoma.",
    "TRUE_FALSE", "Reed-Sternberg cells are the hallmark of Hodgkin lymphoma.",
    "True", "TRUE", "False", "FALSE", "", "", "", ""],

  ["What is the most common malignant tumour of the thyroid gland?",
    "SINGLE_CHOICE", "Papillary carcinoma is the most common thyroid malignancy and has the best prognosis.",
    "Papillary carcinoma", "TRUE", "Follicular carcinoma", "FALSE", "Medullary carcinoma", "FALSE", "Anaplastic carcinoma", "FALSE"],

  ["Which morphological change indicates irreversible cell injury?",
    "SINGLE_CHOICE", "Karyorrhexis (nuclear fragmentation), like pyknosis and karyolysis, reflects irreversible injury; cellular swelling is reversible.",
    "Karyorrhexis", "TRUE", "Cellular swelling", "FALSE", "Fatty change", "FALSE", "Ribosomal detachment", "FALSE"],

  ["A raised serum alpha-fetoprotein (AFP) is most associated with which tumour?",
    "SINGLE_CHOICE", "AFP is a tumour marker for hepatocellular carcinoma (and non-seminomatous germ cell tumours).",
    "Hepatocellular carcinoma", "TRUE", "Colorectal carcinoma", "FALSE", "Prostate carcinoma", "FALSE", "Gastric carcinoma", "FALSE"],

  ["Which features favour an exudate over a transudate?",
    "MULTIPLE_CHOICE", "Exudates are protein-rich with high specific gravity and raised LDH, reflecting increased vascular permeability.",
    "High protein content", "TRUE", "Specific gravity > 1.020", "TRUE", "Raised fluid LDH", "TRUE", "Low protein content", "FALSE"],
]

const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
ws["!cols"] = [{ wch: 70 }, { wch: 16 }, { wch: 60 }, ...Array(8).fill({ wch: 22 })]
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, "Questions")

const out = path.resolve(process.argv[2] || "recall-bulk-upload-sample.xlsx")
XLSX.writeFile(wb, out)
console.log("Wrote", out)
