import { PageShell, ResumeContent } from '@/components/Shared';
import { getProfile, listExperiences, listProjects, listSkills } from '@/lib/data';
import type { ResumePage } from '@/lib/mockData';


function ContactCard({ profile }: { profile: ReturnType<typeof getProfile> }) {
  return (
    <section className="hr-contact-card">
      <div className="hr-contact-copy">
        <p className="eyebrow">Contact</p>
        <h2>期待进一步沟通</h2>
        <p>如果这份定制简历与岗位需求匹配，可以通过以下方式联系我。</p>
        <div className="hr-contact-grid">
          <span><strong>邮箱</strong><a href={`mailto:${profile.email}`}>{profile.email}</a></span>
          {profile.phone && <span><strong>手机</strong><a href={`tel:${profile.phone}`}>{profile.phone}</a></span>}
          {profile.wechatId && <span><strong>微信</strong>{profile.wechatId}</span>}
          {profile.location && <span><strong>所在地</strong>{profile.location}</span>}
        </div>
      </div>
      {profile.wechatQrUrl && (
        <div className="wechat-qr-box">
          <img src={profile.wechatQrUrl} alt="微信二维码" />
          <span>微信扫码联系</span>
        </div>
      )}
    </section>
  );
}

export function getSharePath(resume: ResumePage) {
  return `/r/${resume.shareToken}`;
}

export function CustomResume({ resume, mode }: { resume: ResumePage; mode: 'admin-preview' | 'shared' }) {
  const profile = getProfile();
  const selectedProjects = listProjects({ publishedOnly: mode === 'shared' }).filter((project) => resume.projectIds.includes(project.id));
  const selectedExperiences = listExperiences({ publishedOnly: mode === 'shared' }).filter((experience) => resume.experienceIds.includes(experience.id));
  const selectedSkills = listSkills().filter((skill) => resume.skillIds.includes(skill.id));
  const isShared = mode === 'shared';

  return (
    <PageShell eyebrow={isShared ? 'Exclusive Resume' : 'Admin Preview'} title={resume.headline} description={resume.intro}>
      <div className="custom-intro">
        <div>
          <p className="eyebrow">投递目标</p>
          <h2>{resume.companyName} · {resume.positionName}</h2>
        </div>
        <a className="button ghost" href={`mailto:${profile.email}`}>联系我</a>
      </div>
      {!isShared && (
        <div className="content-card access-note">
          <strong>管理员预览</strong>
          <span>HR 不会访问这个后台预览地址。请在后台复制专属分享链接：{getSharePath(resume)}</span>
        </div>
      )}
      {isShared && (
        <div className="content-card access-note">
          <strong>专属页面</strong>
          <span>这是为 {resume.companyName}「{resume.positionName}」岗位准备的定制页面，不展示其他投递页面入口。</span>
        </div>
      )}
      <div className="content-card prose emphasis">
        <h2>为什么适合这个岗位</h2>
        <p>{resume.motivation}</p>
      </div>
      <ContactCard profile={profile} />
      <ResumeContent
        selectedProjects={selectedProjects}
        selectedExperiences={selectedExperiences}
        selectedSkills={selectedSkills}
        linkProjects
        showContact={false}
      />
    </PageShell>
  );
}
