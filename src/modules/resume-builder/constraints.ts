export const RESUME_YEAR_MIN = 1950;

export const getResumeYearMax = () => new Date().getFullYear();

export const getResumeYearOptions = () => {
  const max = getResumeYearMax();
  return Array.from({ length: max - RESUME_YEAR_MIN + 1 }, (_, index) => max - index);
};

export const RESUME_MONTH_OPTIONS = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
] as const;

export const RESUME_MAX = {
  projectTitle: 60,
  fullName: 80,
  headline: 120,
  locationLabel: 80,
  city: 80,
  country: 80,
  email: 120,
  phone: 40,
  website: 200,
  linkLabel: 60,
  linkUrl: 2048,
  summary: 300,
  minimalSummary: 220,
  declaration: 180,
  declarationPlace: 80,
  declarationName: 80,
  role: 100,
  company: 120,
  degree: 140,
  school: 140,
  location: 120,
  grade: 40,
  experienceSummary: 240,
  projectSummary: 200,
  awardSummary: 200,
  bulletLine: 160,
  minimalBulletLine: 140,
  bulletBlock: 1600,
  tagsLine: 160,
  skill: 40,
  projectName: 120,
  projectLink: 2048,
  certificationName: 120,
  issuer: 120,
  awardTitle: 120,
  awardBy: 120,
  language: 60,
  highlight: 220,
} as const;
