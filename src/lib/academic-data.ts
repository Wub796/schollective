/**
 * Known academic email domains.
 * A curated subset of the ~9,000-entry Hipo university dataset.
 * These are the most common patterns — we also do suffix-based matching
 * (e.g. any .edu, .ac.uk, .edu.au domain) so this list is a bonus boost.
 */
export const KNOWN_ACADEMIC_DOMAINS = new Set([
  // USA — .edu catch-all handled separately, these are high-signal specifics
  "mit.edu", "stanford.edu", "harvard.edu", "caltech.edu", "berkeley.edu",
  "princeton.edu", "yale.edu", "columbia.edu", "uchicago.edu", "upenn.edu",
  "cornell.edu", "dartmouth.edu", "brown.edu", "duke.edu", "vanderbilt.edu",
  "rice.edu", "notre dame.edu", "emory.edu", "georgetown.edu", "tufts.edu",
  "carnegiemellon.edu", "cmu.edu", "jhu.edu", "usc.edu", "virginia.edu",
  "unc.edu", "michigan.edu", "umich.edu", "gatech.edu", "ucsd.edu",
  "ucdavis.edu", "ucsb.edu", "ucsc.edu", "uci.edu", "ucla.edu",
  "nyu.edu", "bu.edu", "northeastern.edu", "purdue.edu", "psu.edu",
  "osu.edu", "umn.edu", "wisc.edu", "illinois.edu", "utexas.edu",
  "uta.edu", "tamu.edu", "uf.edu", "fsu.edu", "miami.edu",
  // UK
  "ox.ac.uk", "cam.ac.uk", "imperial.ac.uk", "ucl.ac.uk", "lse.ac.uk",
  "ed.ac.uk", "bristol.ac.uk", "warwick.ac.uk", "manchester.ac.uk",
  "kcl.ac.uk", "st-andrews.ac.uk", "durham.ac.uk", "bath.ac.uk",
  // Canada
  "utoronto.ca", "ubc.ca", "mcgill.ca", "uwaterloo.ca", "queensu.ca",
  "ualberta.ca", "dal.ca", "uottawa.ca", "mcmaster.ca",
  // Australia
  "anu.edu.au", "unimelb.edu.au", "usyd.edu.au", "unsw.edu.au",
  "uq.edu.au", "monash.edu", "uts.edu.au",
  // Europe
  "ethz.ch", "epfl.ch", "tu-berlin.de", "lmu.de", "tum.de",
  "hu-berlin.de", "uni-heidelberg.de", "uzh.ch", "kuleuven.be",
  "uva.nl", "tudelft.nl", "uu.nl", "sorbonne.fr", "polytechnique.edu",
  // Asia
  "nus.edu.sg", "ntu.edu.sg", "hku.hk", "tsinghua.edu.cn",
  "pku.edu.cn", "u-tokyo.ac.jp", "kyoto-u.ac.jp", "iitb.ac.in",
  "iitd.ac.in", "iitm.ac.in",
]);

/**
 * Academic email domain suffixes — any email ending with these
 * is treated as institutional.
 */
export const ACADEMIC_SUFFIXES = [
  ".edu",
  ".ac.uk", ".ac.nz", ".ac.za", ".ac.in", ".ac.jp", ".ac.kr",
  ".edu.au", ".edu.cn", ".edu.sg", ".edu.hk", ".edu.my",
  ".edu.br", ".edu.ar", ".edu.mx", ".edu.co",
  ".uni.", // e.g. uni-berlin.de patterns
];

/**
 * Known legitimate institution name keywords.
 * If the institution field contains ANY of these, it earns bonus points.
 */
export const INSTITUTION_KEYWORDS = [
  "university", "college", "institute", "school of", "polytechnic",
  "academy", "conservatory", "faculty", "campus", "graduate",
  "research center", "research centre", "laboratory", "labs",
  "sciences", "technology", "engineering", "medical",
];

/**
 * Recognised academic discipline keywords.
 * Used to validate expertise fields.
 */
export const ACADEMIC_DISCIPLINES = new Set([
  // STEM
  "mathematics", "physics", "chemistry", "biology", "geology",
  "astronomy", "statistics", "computer science", "computer engineering",
  "electrical engineering", "mechanical engineering", "civil engineering",
  "chemical engineering", "biomedical engineering", "aerospace",
  "materials science", "neuroscience", "genomics", "biochemistry",
  "bioinformatics", "ecology", "environmental science", "climate science",
  "data science", "machine learning", "artificial intelligence", "ai",
  "deep learning", "natural language processing", "nlp", "robotics",
  "cybersecurity", "information systems", "software engineering",
  "quantum computing", "cryptography", "networking", "distributed systems",
  // Social & Humanities
  "economics", "psychology", "sociology", "anthropology", "philosophy",
  "political science", "international relations", "history", "linguistics",
  "literature", "english", "communications", "media studies", "law",
  "criminology", "education", "public policy", "urban planning",
  "geography", "archaeology", "religious studies", "ethics",
  // Medicine & Health
  "medicine", "public health", "nursing", "pharmacology", "dentistry",
  "veterinary", "epidemiology", "nutrition", "kinesiology", "oncology",
  "cardiology", "neurology", "psychiatry", "pediatrics",
  // Business & Arts
  "business administration", "mba", "finance", "accounting", "marketing",
  "management", "entrepreneurship", "supply chain", "operations",
  "fine arts", "music", "theater", "architecture", "design",
  "film studies", "journalism",
]);
