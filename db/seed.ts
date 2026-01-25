import { randomUUID } from "node:crypto";
import { db, ResumeItem, ResumeProject, ResumeSection } from "astro:db";

const SEED_USER_ID =
  process.env.SEED_USER_ID ||
  process.env.DEV_BYPASS_USER_ID ||
  "dev-user";

const nowDate = () => new Date();

const SECTIONS = [
  { key: "basics", order: 1 },
  { key: "summary", order: 2 },
  { key: "experience", order: 3 },
  { key: "education", order: 4 },
  { key: "skills", order: 5 },
  { key: "projects", order: 6 },
  { key: "certifications", order: 7 },
  { key: "awards", order: 8 },
  { key: "languages", order: 9 },
  { key: "highlights", order: 10 },
  { key: "declaration", order: 11 },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

type ResumeSeed = {
  title: string;
  templateKey: "classic" | "modern" | "minimal" | "timeline";
  basics: any;
  summary: any;
  experience: any[];
  education: any[];
  skills: any[];
  projects: any[];
  certifications: any[];
  awards: any[];
  languages: any[];
  highlights: any[];
  declaration: any;
};

const resumes: ResumeSeed[] = [
  {
    title: "Priya Menon — Product Designer",
    templateKey: "classic",
    basics: {
      fullName: "Priya Menon",
      headline: "Senior Product Designer",
      contact: {
        email: "priya.menon@example.com",
        phone: "+91 98765 43210",
        website: "https://priyamenon.design",
      },
      location: {
        label: "Bengaluru, India",
        city: "Bengaluru",
        country: "India",
      },
      links: [
        { label: "Portfolio", url: "https://priyamenon.design" },
        { label: "LinkedIn", url: "https://linkedin.com/in/priyamenon" },
      ],
    },
    summary: {
      text:
        "Design leader focused on accessible, high-conversion product experiences. Known for clarifying complex systems, shipping crisp UI, and aligning cross-functional teams around measurable outcomes.",
    },
    experience: [
      {
        role: "Senior Product Designer",
        company: "NimbusPay",
        location: "Bengaluru",
        startYear: 2021,
        startMonth: 4,
        present: true,
        summary: "Led checkout and onboarding redesign for consumer fintech platform.",
        bullets: [
          "Reduced onboarding drop-off by 23% through progressive disclosure and clearer CTAs.",
          "Built a scalable design system used across 6 product squads.",
          "Partnered with research to validate flows across mobile and desktop.",
        ],
        tags: ["Design Systems", "UX Research", "Fintech"],
      },
      {
        role: "Product Designer",
        company: "CloudVista",
        location: "Remote",
        startYear: 2018,
        startMonth: 7,
        endYear: 2021,
        endMonth: 3,
        present: false,
        summary: "Owned analytics dashboards for B2B SaaS platform.",
        bullets: [
          "Simplified reporting UI, cutting task time by 32%.",
          "Introduced component patterns for data-heavy interfaces.",
        ],
        tags: ["B2B SaaS", "Data UI"],
      },
    ],
    education: [
      {
        degree: "B.Des — Communication Design",
        school: "National Institute of Design",
        location: "Ahmedabad",
        startYear: 2014,
        endYear: 2018,
        grade: "Distinction",
      },
    ],
    skills: [
      { name: "Product Strategy", level: "Advanced" },
      { name: "Figma", level: "Advanced" },
      { name: "Design Systems", level: "Advanced" },
      { name: "User Research", level: "Intermediate" },
      { name: "Prototyping", level: "Advanced" },
    ],
    projects: [
      {
        name: "NimbusPay Checkout Revamp",
        link: "https://nimbuspay.example.com",
        startYear: 2023,
        startMonth: 2,
        present: true,
        summary: "Redesigned multi-step checkout to reduce friction and improve trust signals.",
        bullets: ["Introduced summary sticky panel and inline validation."],
        tags: ["UX", "Conversion"],
      },
    ],
    certifications: [
      {
        name: "Google UX Design Certificate",
        issuer: "Google",
        year: 2020,
        link: "https://coursera.org",
      },
    ],
    awards: [
      {
        title: "Design Excellence Award",
        year: 2022,
        by: "NimbusPay",
        summary: "Recognized for redesigning onboarding experience.",
      },
    ],
    languages: [
      { name: "English", proficiency: "Fluent" },
      { name: "Malayalam", proficiency: "Native" },
    ],
    highlights: [
      { text: "Led cross-functional design reviews across 3 squads." },
      { text: "Shipped 4 major UX initiatives in 12 months." },
    ],
    declaration: {
      text: "I hereby declare that the information provided above is true to the best of my knowledge.",
      place: "Bengaluru, India.",
      name: "Priya Menon",
    },
  },
  {
    title: "Jordan Lee — Backend Engineer",
    templateKey: "modern",
    basics: {
      fullName: "Jordan Lee",
      headline: "Backend Software Engineer",
      contact: {
        email: "jordan.lee@example.com",
        phone: "+1 415 555 0198",
        website: "https://jordancode.dev",
      },
      location: {
        label: "San Francisco, USA",
        city: "San Francisco",
        country: "USA",
      },
      links: [
        { label: "GitHub", url: "https://github.com/jordanlee" },
        { label: "Blog", url: "https://jordancode.dev/blog" },
      ],
    },
    summary: {
      text:
        "Backend engineer specializing in distributed systems and developer tooling. Focused on reliability, observability, and performance at scale.",
    },
    experience: [
      {
        role: "Backend Engineer",
        company: "Telemetry Labs",
        location: "San Francisco",
        startYear: 2020,
        startMonth: 9,
        present: true,
        summary: "Built observability pipelines processing billions of events daily.",
        bullets: [
          "Improved ingestion throughput by 40% with optimized batching and backpressure.",
          "Designed SLA-aware alerting and on-call tooling.",
        ],
        tags: ["Go", "Kafka", "Postgres"],
      },
      {
        role: "Software Engineer",
        company: "HarborTech",
        location: "San Diego",
        startYear: 2017,
        startMonth: 6,
        endYear: 2020,
        endMonth: 8,
        present: false,
        summary: "Worked on API platform and identity services.",
        bullets: [
          "Implemented JWT-based auth and rotating key management.",
          "Cut p95 latency by 25% by tuning caching and DB indexes.",
        ],
        tags: ["Node.js", "Security"],
      },
    ],
    education: [
      {
        degree: "B.S. — Computer Science",
        school: "University of California, Davis",
        location: "Davis, CA",
        startYear: 2013,
        endYear: 2017,
      },
    ],
    skills: [
      { name: "Go", level: "Advanced" },
      { name: "Node.js", level: "Advanced" },
      { name: "PostgreSQL", level: "Advanced" },
      { name: "Kafka", level: "Intermediate" },
      { name: "AWS", level: "Intermediate" },
    ],
    projects: [
      {
        name: "Trace Insights",
        link: "https://telemetry.example.com",
        startYear: 2022,
        startMonth: 3,
        present: true,
        summary: "Distributed tracing tool for microservices.",
        bullets: ["Reduced query latency using columnar indexes."],
        tags: ["Go", "Tracing"],
      },
    ],
    certifications: [
      {
        name: "AWS Certified Developer",
        issuer: "Amazon Web Services",
        year: 2021,
      },
    ],
    awards: [
      {
        title: "Engineering Impact Award",
        year: 2022,
        by: "Telemetry Labs",
        summary: "Recognized for scaling ingestion pipeline.",
      },
    ],
    languages: [
      { name: "English", proficiency: "Native" },
      { name: "Spanish", proficiency: "Intermediate" },
    ],
    highlights: [
      { text: "Maintained 99.99% uptime for critical services." },
      { text: "Mentored 4 junior engineers on reliability practices." },
    ],
    declaration: {
      text: "I declare that the details above are accurate and complete to the best of my knowledge.",
      place: "San Francisco, USA.",
      name: "Jordan Lee",
    },
  },
  {
    title: "Amelia Fischer — Data Analyst",
    templateKey: "minimal",
    basics: {
      fullName: "Amelia Fischer",
      headline: "Senior Data Analyst",
      contact: {
        email: "amelia.fischer@example.com",
        phone: "+49 30 1234 5678",
        website: "https://ameliafischer.com",
      },
      location: {
        label: "Berlin, Germany",
        city: "Berlin",
        country: "Germany",
      },
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/ameliafischer" },
        { label: "Portfolio", url: "https://ameliafischer.com/work" },
      ],
    },
    summary: {
      text:
        "Data analyst with expertise in product analytics, experimentation, and stakeholder storytelling. Passionate about turning messy data into clear decisions.",
    },
    experience: [
      {
        role: "Senior Data Analyst",
        company: "LumenHealth",
        location: "Berlin",
        startYear: 2021,
        startMonth: 2,
        present: true,
        summary: "Led analytics for patient engagement initiatives.",
        bullets: [
          "Built KPI framework adopted across 5 product teams.",
          "Automated weekly reporting, saving 6 hours per week.",
        ],
        tags: ["SQL", "Looker"],
      },
      {
        role: "Data Analyst",
        company: "Northwind Retail",
        location: "Munich",
        startYear: 2018,
        startMonth: 4,
        endYear: 2021,
        endMonth: 1,
        present: false,
        summary: "Analyzed customer behavior and retention.",
        bullets: [
          "Improved churn insights by building cohort dashboards.",
        ],
        tags: ["Retention", "Cohorts"],
      },
    ],
    education: [
      {
        degree: "M.Sc. — Business Analytics",
        school: "Technical University of Berlin",
        location: "Berlin",
        startYear: 2016,
        endYear: 2018,
      },
    ],
    skills: [
      { name: "SQL", level: "Advanced" },
      { name: "Python", level: "Intermediate" },
      { name: "Looker", level: "Advanced" },
      { name: "A/B Testing", level: "Advanced" },
      { name: "Storytelling", level: "Advanced" },
    ],
    projects: [
      {
        name: "Engagement Scorecard",
        link: "https://lumenhealth.example.com",
        startYear: 2023,
        startMonth: 5,
        present: true,
        summary: "Executive dashboard for patient engagement metrics.",
        tags: ["BI", "Stakeholders"],
      },
    ],
    certifications: [
      {
        name: "Tableau Desktop Specialist",
        issuer: "Tableau",
        year: 2019,
      },
    ],
    awards: [
      {
        title: "Analytics Innovation Award",
        year: 2021,
        by: "Northwind Retail",
      },
    ],
    languages: [
      { name: "German", proficiency: "Native" },
      { name: "English", proficiency: "Fluent" },
    ],
    highlights: [
      { text: "Built reusable experiment templates for faster insights." },
      { text: "Coached PMs on data literacy and KPI design." },
    ],
    declaration: {
      text: "I confirm that the information above is true and correct.",
      place: "Berlin, Germany.",
      name: "Amelia Fischer",
    },
  },
  {
    title: "Carlos Mendes — Project Manager",
    templateKey: "timeline",
    basics: {
      fullName: "Carlos Mendes",
      headline: "Technical Project Manager",
      contact: {
        email: "carlos.mendes@example.com",
        phone: "+351 21 555 7890",
        website: "https://carlosmendes.pm",
      },
      location: {
        label: "Lisbon, Portugal",
        city: "Lisbon",
        country: "Portugal",
      },
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/carlosmendes" },
      ],
    },
    summary: {
      text:
        "Technical PM with a track record of delivering cross-functional initiatives in fintech and logistics. Strong focus on scope clarity, risk management, and stakeholder alignment.",
    },
    experience: [
      {
        role: "Technical Project Manager",
        company: "SwiftLedger",
        location: "Lisbon",
        startYear: 2019,
        startMonth: 9,
        present: true,
        summary: "Led platform migration to new payment stack.",
        bullets: [
          "Delivered migration in 3 phases with zero downtime.",
          "Standardized release checklists across 4 teams.",
        ],
        tags: ["Fintech", "Delivery"],
      },
      {
        role: "Project Manager",
        company: "Oceanic Logistics",
        location: "Porto",
        startYear: 2015,
        startMonth: 1,
        endYear: 2019,
        endMonth: 8,
        present: false,
        summary: "Managed ERP upgrades and vendor integrations.",
        bullets: [
          "Reduced vendor onboarding time by 30% using standard runbooks.",
        ],
        tags: ["ERP", "Operations"],
      },
    ],
    education: [
      {
        degree: "B.A. — Business Administration",
        school: "University of Lisbon",
        location: "Lisbon",
        startYear: 2011,
        endYear: 2015,
      },
    ],
    skills: [
      { name: "Project Planning", level: "Advanced" },
      { name: "Risk Management", level: "Advanced" },
      { name: "Stakeholder Management", level: "Advanced" },
      { name: "Jira", level: "Advanced" },
    ],
    projects: [
      {
        name: "Payment Stack Migration",
        link: "https://swiftledger.example.com",
        startYear: 2022,
        startMonth: 1,
        endYear: 2023,
        endMonth: 6,
        summary: "Modernized payments infrastructure across regions.",
        tags: ["Migration", "Payments"],
      },
    ],
    certifications: [
      {
        name: "PMP Certification",
        issuer: "PMI",
        year: 2020,
      },
    ],
    awards: [
      {
        title: "Operational Excellence Award",
        year: 2018,
        by: "Oceanic Logistics",
      },
    ],
    languages: [
      { name: "Portuguese", proficiency: "Native" },
      { name: "English", proficiency: "Fluent" },
      { name: "Spanish", proficiency: "Intermediate" },
    ],
    highlights: [
      { text: "Delivered 12+ complex projects on schedule." },
      { text: "Known for calm delivery and clear stakeholder updates." },
    ],
    declaration: {
      text: "I hereby declare that the information stated above is true and complete.",
      place: "Lisbon, Portugal.",
      name: "Carlos Mendes",
    },
  },
];

const insertResume = async (resume: ResumeSeed) => {
  const now = nowDate();
  const projectId = randomUUID();

  await db.insert(ResumeProject).values({
    id: projectId,
    userId: SEED_USER_ID,
    title: resume.title,
    templateKey: resume.templateKey,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  });

  const sectionIds: Record<SectionKey, string> = {} as Record<SectionKey, string>;
  for (const section of SECTIONS) {
    const sectionId = randomUUID();
    sectionIds[section.key] = sectionId;
    await db.insert(ResumeSection).values({
      id: sectionId,
      projectId,
      key: section.key,
      order: section.order,
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  const insertItem = async (key: SectionKey, data: any, order = 1) => {
    await db.insert(ResumeItem).values({
      id: randomUUID(),
      sectionId: sectionIds[key],
      order,
      data: JSON.stringify(data),
      createdAt: now,
      updatedAt: now,
    });
  };

  await insertItem("basics", resume.basics);
  await insertItem("summary", resume.summary);

  await Promise.all(
    resume.experience.map((item, index) =>
      insertItem("experience", item, index + 1)
    )
  );
  await Promise.all(
    resume.education.map((item, index) =>
      insertItem("education", item, index + 1)
    )
  );
  await Promise.all(
    resume.skills.map((item, index) =>
      insertItem("skills", item, index + 1)
    )
  );
  await Promise.all(
    resume.projects.map((item, index) =>
      insertItem("projects", item, index + 1)
    )
  );
  await Promise.all(
    resume.certifications.map((item, index) =>
      insertItem("certifications", item, index + 1)
    )
  );
  await Promise.all(
    resume.awards.map((item, index) =>
      insertItem("awards", item, index + 1)
    )
  );
  await Promise.all(
    resume.languages.map((item, index) =>
      insertItem("languages", item, index + 1)
    )
  );
  await Promise.all(
    resume.highlights.map((item, index) =>
      insertItem("highlights", item, index + 1)
    )
  );
  await insertItem("declaration", resume.declaration);
};

export default async function seed() {
  await db.delete(ResumeItem);
  await db.delete(ResumeSection);
  await db.delete(ResumeProject);

  for (const resume of resumes) {
    await insertResume(resume);
  }
}
