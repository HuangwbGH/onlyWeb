# OpenClaw 权限设置笔记

> 用途：记录 OpenClaw 中与命令执行、工具权限、聊天渠道触发执行相关的常用权限配置。
>
> 重点关注：
> - WebUI 是否具备执行 CLI 命令的能力
> - 聊天渠道是否可以触发命令执行
> - 是否需要人工审批
> - 哪些配置属于高风险的“最大权限”设置

---

## 目录

- [1. 设置 `tools.profile = "full"` 后，WebUI 获得执行 CLI / 工具命令的基础权限](#1-设置-toolsprofile--full-后webui-获得执行-cli--工具命令的基础权限)
- [2. 设置 `commands.native` 后，聊天渠道可触发命令执行，但仍可能需要在 WebUI 中点击确认](#2-设置-commandsnative-后聊天渠道可触发命令执行但仍可能需要在-webui-中点击确认)
- [3. 最大权限设置：聊天渠道可直接触发，且无需审批即可执行命令](#3-最大权限设置聊天渠道可直接触发且无需审批即可执行命令)
- [4. `channels.<provider>.skills` 会影响插件 / skill 是否能被聊天渠道调用](#4-channelsproviderskills-会影响插件--skill-是否能被聊天渠道调用)
- [5. 三种常见使用场景对照](#5-三种常见使用场景对照)
- [6. 记忆要点](#6-记忆要点)

---

## 1. 设置 `tools.profile = "full"` 后，WebUI 获得执行 CLI / 工具命令的基础权限

配置示例：

```json5
{
  tools: {
    profile: "full",
  },
}
```

说明：
- 将 `tools.profile` 设为 `"full"`，表示放宽工具能力基线
- 设置后，WebUI 具备执行 CLI / 命令相关能力的基础前提
- 这是放开工具权限最常见、最直接的一步

注意：
- 这不代表所有命令都会无条件成功
- 实际仍可能受以下因素影响：
  - `tools.allow` / `tools.deny`
  - `tools.exec.*`
  - `commands.*`
  - `gateway.nodes.denyCommands`
  - sandbox
  - 审批机制
  - 宿主系统权限

---

## 2. 设置 `commands.native` 后，聊天渠道可触发命令执行，但仍可能需要在 WebUI 中点击确认

配置示例：

```json5
{
  commands: {
    native: true,
  },
}
```

说明：
- 设置完成后，聊天渠道具备触发命令执行的能力
- 但命令是否真正执行，仍可能需要在 WebUI 中点击确认
- 适合“允许聊天里发起命令，但保留人工确认”的场景

补充：
- 按当前使用习惯，这里记录为 `native: true`
- 在另一套文档口径里，也常见写成：
  - `native: "auto"`
  - `native: "always"`
  - `native: "never"`
- 实际以当前 OpenClaw 版本 schema 可接受写法为准

---

## 3. 最大权限设置：聊天渠道可直接触发，且无需审批即可执行命令

配置示例：

```json5
{
  tools: {
    profile: "full",
    exec: {
      host: "gateway",
      security: "full",
    },
  },
  commands: {
    native: true,
  },
}
```

说明：
- 这是更完整的高权限设置
- 工具权限放宽为 `full`
- exec 直接运行在 `gateway` 侧
- `security: "full"` 表示 exec 安全限制进一步放宽
- `commands.native: true` 表示聊天渠道也具备触发命令执行的能力
- 可记为：**聊天渠道可直接触发，且无需审批即可执行命令**

风险提醒：
- 这个配置会显著放宽命令执行权限
- 如果聊天入口（如钉钉、飞书）本身也配置得较开放，会明显提高误操作或被诱导执行高风险命令的风险
- 建议仅在完全可信环境下使用

---

## 4. `channels.<provider>.skills` 会影响插件 / skill 是否能被聊天渠道调用

配置示例：

```json5
{
  channels: {
    "dingtalk-connector": {
      enabled: true,
      clientId: "...",
      clientSecret: "...",
      ackText: "🫡 任务已接收",
      skills: ["*"],
    },
  },
}
```

说明：
- `channels.<provider>.enabled = true` 表示该聊天渠道已启用
- `skills` 用来控制：**这个渠道进来的消息，允许调用哪些 skill / 插件能力**
- `skills: ["*"]` 表示该渠道对 skill 不做名称级限制，允许调用所有已安装且可被当前运行环境使用的 skill
- 因此，这一项会直接影响：**插件调用 skill 的权限边界**

要点区分：
- `channels.<provider>.skills` 管的是：**这个渠道能不能调用某个 skill**
- `tools.profile`、`tools.allow` / `tools.deny`、`tools.exec.*`、`commands.native` 管的是：**被调用后，底层工具 / 命令是否允许真正执行**
- 也就是说：
  - `skills: ["*"]` ≠ 一切系统命令都自动放开
  - 但它确实会让该渠道拥有更大的“可调用 skill 范围”

结合钉钉配置这段：

```json5
{
  channels: {
    "dingtalk-connector": {
      enabled: true,
      clientId: "...",
      clientSecret: "...",
      ackText: "🫡 任务已接收",
      skills:["*"],
    },
  },
}
```

可以理解为：
- 钉钉渠道已开启
- 收到消息后会先回复 `🫡 任务已接收`
- 该渠道对 skill 调用范围是“全开”
- 所以如果某个 skill 本身能够调用浏览器、exec、外部 API、文件系统等能力，那么钉钉侧也更容易间接触发这些能力

风险提醒：
- `skills: ["*"]` 属于更宽松的渠道级 skill 权限
- 如果该渠道又同时具备：
  - `commands.native`
  - `tools.profile = "full"`
  - 宽松的 `tools.exec.*`
  - 较少审批限制
- 那整体风险会叠加
- 更稳妥的做法通常是把 `skills` 收敛成白名单，只开放必要 skill

---

## 5. 三种常见使用场景对照

### 场景 A：只想让 WebUI 有执行命令的能力

```json5
{
  tools: {
    profile: "full",
  },
}
```

特点：
- WebUI 有基础工具权限
- 适合先在本地控制台里使用
- 相对温和

### 场景 B：聊天渠道可以发起命令，但仍需要人工确认

```json5
{
  tools: {
    profile: "full",
  },
  commands: {
    native: true,
  },
}
```

特点：
- 聊天渠道可以触发命令
- 但执行前仍可能需要在 WebUI 中确认
- 相对更稳妥

### 场景 C：最大权限，聊天渠道触发后可直接执行

```json5
{
  tools: {
    profile: "full",
    exec: {
      host: "gateway",
      security: "full",
    },
  },
  commands: {
    native: true,
  },
}
```

特点：
- 属于高权限配置
- 聊天渠道可以直接触发命令
- 无需审批即可执行命令
- 风险最高

---

## 6. 记忆要点

- `tools.profile = "full"`：放开工具能力基线
- `commands.native`：让聊天渠道也具备触发命令执行的能力
- `channels.<provider>.skills`：决定该聊天渠道允许调用哪些 skill / 插件
- `skills: ["*"]`：表示该渠道对 skill 名称范围不设限，属于更宽松的渠道级 skill 权限
- `tools.exec.host = "gateway"` + `tools.exec.security = "full"`：属于高权限执行配置
- `commands.native = true` + `tools.exec.host = "gateway"` + `tools.exec.security = "full"`：可记为聊天渠道可直接触发、且无需审批的最大权限配置
- 渠道级 skill 权限放开，不等于底层命令一定放开；但两者叠加时，整体风险会明显上升
- 权限放开后，不等于完全无风险；聊天入口越开放，风险越大
