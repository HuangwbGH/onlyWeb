export type Project = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  techStack: string[];
  role: string;
  highlights: string[];
  demoUrl?: string;
  effectDemoType?: 'video' | 'document';
  effectDemoTitle?: string;
  effectDemoDescription?: string;
  effectDemoUrl?: string;
  businessTitle?: string;
  businessTagline?: string;
  businessScenario?: string;
  businessCoreValue?: string;
  businessDeliveryForm?: string;
  businessPainPoints?: string[];
  businessSolutionSteps?: string[];
  businessResult?: string;
  businessValues?: string[];
  businessContributions?: string[];
  businessAudienceFocus?: string[];
  businessResourceLabels?: string[];
  businessTechNotes?: string[];
  githubUrl?: string;
  docsUrl?: string;
  showDescription: boolean;
  showRole: boolean;
  showEffectDemo: boolean;
  showHighlights: boolean;
  showTechStack: boolean;
  showLinks: boolean;
  isFeatured: boolean;
  isPublished: boolean;
};

export type Experience = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  summary: string;
  highlights: string[];
  skills: string[];
  isPublished: boolean;
};

export type Skill = {
  id: string;
  name: string;
  category: string;
  level: number;
};

export type ResumePage = {
  id: string;
  companyName: string;
  companySlug: string;
  positionName: string;
  positionSlug: string;
  headline: string;
  intro: string;
  motivation: string;
  projectIds: string[];
  experienceIds: string[];
  skillIds: string[];
  isPublished: boolean;
  shareToken: string;
};

export const profile = {
  name: '陈一鸣',
  title: '全栈 / AI 应用工程师',
  bio: '我关注从 0 到 1 构建产品，擅长把前端体验、后端能力和 AI 工具链组合成可交付的小型系统。',
  location: '上海 / 远程',
  email: 'hello@example.com',
  phone: '+86 138 0000 0000',
  githubUrl: 'https://github.com/example',
  linkedinUrl: 'https://linkedin.com/in/example',
  websiteUrl: 'https://onlyweb.example.com',
};

export const projects: Project[] = [
  {
    id: 'p1',
    title: 'onlyWeb 定制简历系统',
    slug: 'onlyweb-resume-system',
    summary: '面向个人求职的动态简历与作品集管理系统。',
    description:
      '一个可以针对不同公司和岗位生成定制简历页面的小型系统，同时沉淀个人项目、经历和技能，支持 Docker 化部署。',
    techStack: ['React', 'TypeScript', 'SQLite', 'Docker'],
    role: '产品规划、前端架构、后端数据建模',
    highlights: ['动态路由生成投递页面', '项目和经历可被多个简历页复用', '面向个人长期维护的轻量架构'],
    demoUrl: 'https://onlyweb.example.com',
    githubUrl: 'https://github.com/example/onlyweb',
    showDescription: true,
    showRole: true,
    showEffectDemo: true,
    showHighlights: true,
    showTechStack: true,
    showLinks: true,
    isFeatured: true,
    isPublished: true,
  },
  {
    id: 'p2',
    title: 'AI 文档助手',
    slug: 'ai-doc-assistant',
    summary: '把复杂文档转换成摘要、问答和结构化知识库的工具。',
    description:
      '支持上传长文档，自动提取章节、重点、待办和风险点，适合团队知识沉淀与项目交接。',
    techStack: ['Next.js', 'OpenAI API', 'Vector Search', 'Tailwind CSS'],
    role: '全栈开发、Prompt 设计、交互设计',
    highlights: ['长文档分块处理', '支持基于来源的问答', '降低项目交接成本'],
    docsUrl: 'https://docs.example.com',
    showDescription: true,
    showRole: true,
    showEffectDemo: true,
    showHighlights: true,
    showTechStack: true,
    showLinks: true,
    isFeatured: true,
    isPublished: true,
  },
  {
    id: 'p3',
    title: '组件库实验室',
    slug: 'component-lab',
    summary: '一组为内部系统沉淀的高复用业务组件。',
    description:
      '围绕表单、表格、筛选、批量操作等后台高频场景，建立统一设计语言和组件规范。',
    techStack: ['React', 'Storybook', 'Vitest', 'CSS Modules'],
    role: '组件设计、测试、文档建设',
    highlights: ['提升后台页面交付效率', '统一交互和视觉规范', '补充单元测试和示例文档'],
    githubUrl: 'https://github.com/example/component-lab',
    showDescription: true,
    showRole: true,
    showEffectDemo: true,
    showHighlights: true,
    showTechStack: true,
    showLinks: true,
    isFeatured: false,
    isPublished: true,
  },
];

export const experiences: Experience[] = [
  {
    id: 'e1',
    company: '星河科技',
    role: '高级前端工程师',
    startDate: '2022.06',
    endDate: '至今',
    summary: '负责企业级 SaaS 产品的前端架构、业务组件建设和性能优化。',
    highlights: ['重构核心工作台页面，首屏加载时间下降 38%', '建设表单与表格组件规范，减少重复开发', '推动前端测试和发布检查流程'],
    skills: ['React', 'TypeScript', 'Vite', '性能优化'],
    isPublished: true,
  },
  {
    id: 'e2',
    company: '云杉智能',
    role: '全栈工程师',
    startDate: '2020.03',
    endDate: '2022.05',
    summary: '参与 AI 数据平台建设，覆盖前端页面、Node 服务和数据可视化。',
    highlights: ['从 0 到 1 搭建标注任务管理系统', '实现多角色权限和任务流转', '与算法团队协作落地模型评估面板'],
    skills: ['Node.js', 'React', 'SQLite', '数据可视化'],
    isPublished: true,
  },
];

export const skills: Skill[] = [
  { id: 's1', name: 'React', category: '前端', level: 5 },
  { id: 's2', name: 'TypeScript', category: '前端', level: 5 },
  { id: 's3', name: 'TanStack / Next.js', category: '前端', level: 4 },
  { id: 's4', name: 'Node.js', category: '后端', level: 4 },
  { id: 's5', name: 'SQLite', category: '后端', level: 4 },
  { id: 's6', name: 'Docker', category: '工程化', level: 4 },
  { id: 's7', name: 'AI 应用开发', category: 'AI', level: 4 },
  { id: 's8', name: '产品原型设计', category: '产品', level: 4 },
];

export const resumePages: ResumePage[] = [
  {
    id: 'r1',
    companyName: '字节跳动',
    companySlug: 'bytedance',
    positionName: '前端工程师',
    positionSlug: 'frontend-engineer',
    headline: '面向字节跳动前端工程师岗位的个人介绍',
    intro:
      '我具备复杂前端系统建设、组件化沉淀和跨团队协作经验，希望将过往在 SaaS 与 AI 工具平台中的工程实践用于高质量产品交付。',
    motivation:
      '该岗位强调前端工程能力、产品体验和高质量交付，我的经历与 React/TypeScript 体系、性能优化和业务组件建设高度匹配。',
    projectIds: ['p1', 'p3'],
    experienceIds: ['e1', 'e2'],
    skillIds: ['s1', 's2', 's3', 's6'],
    isPublished: true,
    shareToken: 'hr-bytedance-frontend-2026',
  },
  {
    id: 'r2',
    companyName: 'OpenAI',
    companySlug: 'openai',
    positionName: 'AI 应用工程师',
    positionSlug: 'ai-application-engineer',
    headline: '面向 OpenAI AI 应用工程师岗位的个人介绍',
    intro:
      '我关注 AI 能力如何真正进入业务流程，并擅长把模型能力、产品体验和工程系统结合起来，交付可用的 AI 应用。',
    motivation:
      '该岗位需要 AI 应用落地、产品判断和工程实现能力，我的文档助手、动态简历系统和全栈经验可以形成直接支撑。',
    projectIds: ['p1', 'p2'],
    experienceIds: ['e2'],
    skillIds: ['s2', 's4', 's5', 's7', 's8'],
    isPublished: true,
    shareToken: 'hr-openai-ai-app-2026',
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug && project.isPublished);
}

export function getResumeByToken(shareToken: string) {
  return resumePages.find((resume) => resume.shareToken === shareToken && resume.isPublished);
}

export function getResumeBySlugs(companySlug: string, positionSlug: string) {
  return resumePages.find(
    (resume) => resume.companySlug === companySlug && resume.positionSlug === positionSlug && resume.isPublished,
  );
}
