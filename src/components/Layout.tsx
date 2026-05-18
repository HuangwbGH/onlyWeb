const navItems = [
  { href: '/', label: '首页' },
  { href: '/projects', label: '作品' },
  { href: '/resume', label: '简历' },
  { href: '/contact', label: '联系' },
  { href: '/admin', label: '后台' },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="/">
        <span className="brand-mark">OW</span>
        <span>onlyWeb</span>
      </a>
      <nav className="site-nav">
        {navItems.map((item) => (
          <a key={item.href} href={item.href}>{item.label}</a>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>© 2026 onlyWeb</span>
      <span>Docker 化个人作品与定制简历系统</span>
    </footer>
  );
}

export function ShareHeader() {
  return (
    <header className="site-header share-header">
      <div className="brand">
        <span className="brand-mark">OW</span>
        <span>onlyWeb</span>
      </div>
      <span className="share-badge">专属投递页面</span>
    </header>
  );
}

export function ShareFooter({ email }: { email: string }) {
  return (
    <footer className="site-footer">
      <span>此页面仅用于本次岗位投递沟通</span>
      <span>{email}</span>
    </footer>
  );
}
