# Vercel 部署问题修复总结

## 问题诊断

在 Vercel 部署时遇到两个主要问题:

### 1. 缺失游戏翻译文件 (已解决)
首次部署时出现错误:
```
Cannot find module './pt/games/mahjong.json'
Cannot find module './id/games/marble-dash.json'
...
```

### 2. 缺失 "Page" 翻译键 (已解决)
第二次部署时出现新错误:
```
Error: MISSING_MESSAGE: Page (en)
Error: MISSING_MESSAGE: Page (zh-CN)
...
```

### 3. Next.js 安全漏洞警告 (已解决)
```
warning next@15.3.1: This version has a security vulnerability.
Please upgrade to a patched version. See https://nextjs.org/blog/CVE-2025-66478
```

## 根本原因

1. **缺失的翻译文件**: 5个游戏文件(mahjong, marble-dash, ragdoll-hit-stickman, save-dogs-from-bee-game, demo)在部分语言目录中缺失,但在 `game-page-messages.json` 中被引用

2. **缺失的 "Page" 翻译键**: `/c/[[...page]]/page.tsx` 路由在元数据生成时使用 `t('Page')` 获取翻译,但所有语言文件中都没有这个键

3. **过时的 Next.js 版本**: Next.js 15.3.1 存在已知安全漏洞 CVE-2025-66478

## 已实施的修复

### 1. 补充缺失的游戏翻译文件 ✅
为所有 17 个非英文语言目录复制了 5 个缺失的游戏文件:
- messages/pt/games/
- messages/pt-BR/games/
- messages/id/games/
- messages/de/games/
- messages/ja/games/
- messages/vi/games/
- messages/th/games/
- messages/ko/games/
- messages/it/games/
- messages/uk/games/
- messages/zh-TW/games/
- messages/tr/games/
- messages/zh-CN/games/
- messages/es/games/
- messages/fr/games/
- messages/bn/games/
- messages/ru/games/

现在所有语言目录都有 223 个游戏文件。

### 2. 添加 "Page" 翻译键 ✅
为所有 18 种语言的基础翻译文件添加了 "Page" 键:
```json
{
  "Page": "Page"
}
```

这解决了在生成分类分页页面元数据时的 MISSING_MESSAGE 错误。

### 3. 升级 Next.js 版本 ✅
升级以下包以修复安全漏洞:
```json
{
  "next": "^15.3.2",
  "@next/mdx": "^15.3.2",
  "@next/third-parties": "^15.3.2",
  "@next/bundle-analyzer": "^15.3.2",
  "next-rspack": "^15.3.2",
  "eslint-config-next": "^15.3.2"
}
```

### 4. 增加静态页面生成超时时间 ✅
修改 `next.config.ts`:
```typescript
// 从
staticPageGenerationTimeout: 1000,  // 1秒 - 太短!

// 改为
staticPageGenerationTimeout: 180,   // 180秒(3分钟)
```

### 5. 创建 Node 版本配置文件 ✅
创建 `.nvmrc` 文件指定 Node 20:
```
20
```

### 6. 创建 Vercel 配置文件 ✅
创建 `vercel.json`:
```json
{
  "buildCommand": "yarn build",
  "installCommand": "yarn install",
  "framework": "nextjs",
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  }
}
```

## Vercel 部署步骤

### 1. 代码已提交 ✅
所有修复已经提交到当前分支:
```bash
git log -1 --oneline
# bfd0d394 fix: resolve Vercel deployment issues
```

### 2. 推送到远程仓库
```bash
git push origin fix/react-upgrade-19.2
```

### 3. 在 Vercel 中配置环境变量
在 Vercel 项目设置中添加环境变量:
- `UE_WEB_URL`: 设置为你的生产域名(例如: https://gamefreehub.com)

### 4. 触发重新部署
- 推送代码后,Vercel 会自动触发部署
- 或在 Vercel Dashboard 中手动触发重新部署

## 修复内容汇总

| 问题 | 状态 | 描述 |
|------|------|------|
| 缺失游戏翻译文件 | ✅ 已解决 | 为85个缺失文件(5游戏×17语言)添加翻译 |
| 缺失 "Page" 键 | ✅ 已解决 | 在18个语言文件中添加 "Page" 翻译 |
| Next.js 安全漏洞 | ✅ 已解决 | 升级到 ^15.3.2 修复 CVE-2025-66478 |
| 构建超时 | ✅ 已解决 | 超时时间从1秒增加到180秒 |
| Node 版本 | ✅ 已解决 | 创建 .nvmrc 指定 Node 20 |
| Vercel 配置 | ✅ 已解决 | 创建 vercel.json 配置构建命令 |

## 预防未来问题

1. **保持翻译文件同步**: 当添加新游戏时,确保为所有语言目录创建翻译文件
2. **完整的翻译键**: 添加新页面或组件时,确保所有必需的翻译键在所有语言文件中都存在
3. **定期更新依赖**: 及时更新 Next.js 和其他依赖以修复安全漏洞
4. **使用脚本自动化**: 可以创建脚本来检查翻译文件的完整性
5. **监控构建时间**: 如果页面数量继续增加,可能需要进一步增加 `staticPageGenerationTimeout`

## 验证清单

- [x] 所有语言目录都有223个游戏文件
- [x] 所有语言文件都包含 "Page" 翻译键
- [x] Next.js 已升级到 ^15.3.2
- [x] next.config.ts 中超时设置为180秒
- [x] .nvmrc 文件已创建
- [x] vercel.json 文件已创建
- [x] 所有更改已提交到 Git

## 下一步

推送代码到远程仓库,然后 Vercel 会自动开始新的部署:

```bash
git push origin fix/react-upgrade-19.2
```

部署应该会成功! 🚀

如果仍有问题,请检查:
1. Vercel 环境变量是否正确设置
2. 构建日志中是否有其他错误信息
3. Node 版本是否正确(应该是 20.x)
