# 工具下载地址记录

## RustDesk 远程桌面控制工具

- **版本**: 1.4.5
- **下载地址**: https://github.com/rustdesk/rustdesk/releases/tag/1.4.5
- **类型**: 远程桌面控制
- **特点**: 开源、免费、自建服务器
- **记录时间": "2026-02-28"

### 备用信息
- GitHub 主页: https://github.com/rustdesk/rustdesk
- 官网: https://rustdesk.com/
- 支持平台: Windows, macOS, Linux, Android, iOS

### 自建服务器命令（如需）
```bash
# Docker 部署 RustDesk Server
docker run --name rustdesk-server -p 21115:21115 -p 21116:21116 -p 21116:21116/udp -p 21118:21118 -v /path/to/data:/root rustdesk/rustdesk-server
```
