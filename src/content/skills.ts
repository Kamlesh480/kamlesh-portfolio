import type { SkillGroup } from './types'

/**
 * Grounded strictly in the resume/LinkedIn PDFs and the personal-project brief
 * (name withheld — not publishable).
 * Deliberately does NOT include buzzword-adjacent items (GraphQL, Terraform,
 * Spring Boot, generic "RAG"/"vector databases") that aren't evidenced by
 * those source documents — see the content-honesty principle in the
 * project plan.
 */
export const skillGroups: SkillGroup[] = [
  {
    category: 'backend',
    label: 'Backend Engineering',
    description: 'API and service design, data modeling, billing, and multi-tenant systems — not just CRUD.',
    skills: [
      'Python', 'FastAPI', 'Django', 'Django REST Framework', 'ORM',
      'REST APIs', 'Authentication & Authorization', 'RBAC & Multi-Tenancy',
      'Stripe Billing Integration', 'MySQL', 'PostgreSQL',
      'Redis', 'RabbitMQ', 'Data Structures & Algorithms', 'OOP', 'JSON',
    ],
  },
  {
    category: 'data-ai',
    label: 'Data & AI Infrastructure',
    description: 'Large-scale data platforms and production LLM infrastructure — not just API integrations.',
    skills: [
      'Trino', 'Apache Iceberg', 'ClickHouse', 'Google BigQuery', 'Apache Spark',
      'Hive Metadata', 'Argo Workflows', 'LLM Processing Infrastructure',
      'vLLM / GPU Inference', 'Prompt-Scoped Entity Extraction', 'NLP',
      'Multi-Database Architecture',
    ],
  },
  {
    category: 'frontend',
    label: 'Frontend Engineering',
    description: 'End-to-end product features, not just component styling.',
    skills: [
      'React', 'Next.js', 'TypeScript', 'JavaScript', 'Redux', 'Vue.js',
      'Material UI', 'Framer Motion', 'Tailwind CSS', 'HTML', 'CSS', 'Ajax',
    ],
  },
  {
    category: 'cloud-devops',
    label: 'Cloud & DevOps',
    description: 'Shipping and operating what gets built.',
    skills: [
      'Docker', 'Kubernetes', 'AWS (EC2, S3, CloudFront, ECS)',
      'Google Cloud Platform', 'GCP Cloud Run', 'Cloud SQL', 'Cloud Tasks',
      'CI/CD', 'GitHub Actions', 'Jenkins', 'Ansible', 'CircleCI', 'Git',
    ],
  },
]
