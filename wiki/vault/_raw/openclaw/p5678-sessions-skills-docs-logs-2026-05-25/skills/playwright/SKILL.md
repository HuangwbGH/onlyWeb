---
name: playwright
description: Playwright browser automation with CDP (Chrome DevTools Protocol) support. Connect to existing Chrome instance for automation, scraping, and testing.
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["node", "npx"] },
      },
  }
---

# Playwright Skill (CDP Mode)

This skill uses Playwright to connect to an existing Chrome instance via CDP (Chrome DevTools Protocol).

## ✅ CDP 已配置

Chrome 正在运行，CDP 端口: `9222`

## 快速使用

### 1. 检查 CDP 状态
```bash
node ~/.openclaw/workspace/skills/playwright/cdp-connector.js status
```

### 2. 列出所有页面
```bash
node ~/.openclaw/workspace/skills/playwright/cdp-connector.js pages
```

### 3. 导航到指定 URL
```bash
node ~/.openclaw/workspace/skills/playwright/cdp-connector.js navigate https://github.com
```

### 4. 截图
```bash
node ~/.openclaw/workspace/skills/playwright/cdp-connector.js screenshot https://github.com github.png
```

## JavaScript API

```javascript
const { connectCDP } = require('./cdp-connector.js');

(async () => {
  const { browser, context, page } = await connectCDP();
  
  // 使用 page 进行自动化操作
  await page.goto('https://example.com');
  await page.click('button');
  
  await browser.close();
})();
```

## 环境变量

- `PLAYWRIGHT_CDP_ENDPOINT` - CDP 端点 (默认: http://127.0.0.1:9222)

## CDP 端点

- http://127.0.0.1:9222/json - 列出可调试页面
- http://127.0.0.1:9222/json/version - 浏览器版本
- http://127.0.0.1:9222/devtools/inspector.html - DevTools UI

## Playwright CLI

```bash
# 截图
npx playwright screenshot --browser=chromium https://example.com screenshot.png

# PDF
npx playwright pdf https://example.com page.pdf

# 代码生成
npx playwright codegen --browser=chromium https://example.com
```
