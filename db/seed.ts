import { db } from 'astro:db';
import { ResumeTemplates } from './config';

// https://astro.build/db/seed
export default async function seed() {
  const now = new Date().toISOString();

  const templates = [
    {
      id: 'tpl-modern-blue',
      key: 'modern-blue',
      name: 'Modern Blue',
      description: 'Clean two-column layout with blue highlights.',
      is_default: true,
      is_active: true,
    },
    {
      id: 'tpl-minimal-white',
      key: 'minimal-white',
      name: 'Minimal White',
      description: 'Lightweight single-column resume with simple typography.',
      is_default: false,
      is_active: true,
    },
    {
      id: 'tpl-two-column-professional',
      key: 'two-column-professional',
      name: 'Two Column Professional',
      description: 'Balanced sidebar template for concise professional summaries.',
      is_default: false,
      is_active: true,
    },
    {
      id: 'tpl-creative-accent',
      key: 'creative-accent',
      name: 'Creative Accent',
      description: 'Expressive resume with accent colors for creative roles.',
      is_default: false,
      is_active: true,
    },
    {
      id: 'tpl-executive-serif',
      key: 'executive-serif',
      name: 'Executive Serif',
      description: 'Classic serif styling suited for leadership positions.',
      is_default: false,
      is_active: true,
    },
    {
      id: 'tpl-clean-monoline',
      key: 'clean-monoline',
      name: 'Clean Monoline',
      description: 'Modern monoline design with crisp dividers and spacing.',
      is_default: false,
      is_active: true,
    },
  ].map((template) => ({
    ...template,
    created_at: now,
    updated_at: now,
  }));

  await db.insert(ResumeTemplates).values(templates);
}
