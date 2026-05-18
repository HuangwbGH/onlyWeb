import { getProfile } from '@/lib/data';
import type { Experience, Project, Skill } from '@/lib/mockData';

export function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="section-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}

export function PageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page-shell">
      <section className="page-hero">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
      {children}
    </div>
  );
}

export function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="feature-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export function ProjectGrid({ projects, linkable = true }: { projects: Project[]; linkable?: boolean }) {
  return (
    <div className="project-grid">
      {projects.map((project) => {
        const content = (
          <>
            <div className="project-cover">{project.title.slice(0, 2)}</div>
            <div>
              <p className="eyebrow">{project.isFeatured ? 'Featured' : 'Project'}</p>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <TagList items={project.techStack.slice(0, 4)} />
            </div>
          </>
        );

        return linkable ? (
          <a className="project-card" key={project.id} href={`/projects/${project.slug}`}>
            {content}
          </a>
        ) : (
          <article className="project-card" key={project.id}>
            {content}
          </article>
        );
      })}
    </div>
  );
}

export function ExperienceItem({ experience }: { experience: Experience }) {
  return (
    <article className="timeline-item">
      <div className="timeline-meta">{experience.startDate} - {experience.endDate}</div>
      <div>
        <h3>{experience.company} · {experience.role}</h3>
        <p>{experience.summary}</p>
        <ul>
          {experience.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
        </ul>
      </div>
    </article>
  );
}

export function TagList({ items }: { items: string[] }) {
  return <div className="tag-list">{items.map((item) => <span key={item}>{item}</span>)}</div>;
}

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function ResumeContent({
  selectedProjects,
  selectedExperiences,
  selectedSkills,
  linkProjects = true,
  showContact = true,
}: {
  selectedProjects: Project[];
  selectedExperiences: Experience[];
  selectedSkills: Skill[];
  linkProjects?: boolean;
  showContact?: boolean;
}) {
  const profile = getProfile();

  return (
    <div className="resume-stack">
      <section className="content-card">
        <SectionTitle eyebrow="Skills" title="核心技能" />
        <TagList items={selectedSkills.map((skill) => skill.name)} />
      </section>

      <section className="content-card">
        <SectionTitle eyebrow="Experience" title="相关经历" />
        <div className="timeline">
          {selectedExperiences.map((experience) => (
            <ExperienceItem key={experience.id} experience={experience} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="Projects" title="相关项目" />
        <ProjectGrid projects={selectedProjects} linkable={linkProjects} />
      </section>

      {showContact && (
        <section className="content-card contact-strip">
          <div>
            <h2>联系方式</h2>
            <p>{profile.email} · {profile.location}</p>
          </div>
          <a className="button primary" href={`mailto:${profile.email}`}>发送邮件</a>
        </section>
      )}
    </div>
  );
}
