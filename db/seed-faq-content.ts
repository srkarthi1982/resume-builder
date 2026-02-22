import { Faq, db, eq } from "astro:db";

type FaqItem = { category: string; question: string; answer: string };

const FAQS: FaqItem[] = [
  {
    category: "Templates",
    question: "How many resume templates are available?",
    answer:
      "Resume Builder includes multiple curated templates suitable for different professional styles. You can choose the one that fits your profile and keep your content consistent.",
  },
  {
    category: "Export",
    question: "Can I download my resume as PDF?",
    answer:
      "Yes. You can generate a print-ready PDF from your resume view and use it for job applications.",
  },
  {
    category: "Editing",
    question: "Can I edit my resume later?",
    answer:
      "Yes. Your resume projects can be reopened and updated anytime, so you can keep experience, skills, and details current.",
  },
  {
    category: "Privacy",
    question: "Is my resume data private?",
    answer:
      "Your resume content is tied to your account and is not publicly listed by default. Access to editing is limited to your authenticated session.",
  },
  {
    category: "Projects",
    question: "Can I create multiple resumes?",
    answer:
      "Yes. You can maintain multiple resume projects for different roles or industries and switch between them as needed.",
  },
];

export default async function seedFaqContent() {
  await db.delete(Faq).where(eq(Faq.audience, "user"));

  await db.insert(Faq).values(
    FAQS.map((item, index) => ({
      audience: "user",
      category: item.category,
      question: item.question,
      answer_md: item.answer,
      sort_order: index + 1,
      is_published: true,
      created_at: new Date(),
      updated_at: new Date(),
    }))
  );

  console.log(`Seeded ${FAQS.length} production FAQs for resume-builder user audience.`);
}
