# Vercel 部署问题修复总结

## 问题诊断

在 Vercel 部署时,构建过程失败,原因是尝试加载不存在的游戏翻译文件。错误信息显示:
```
Cannot find module './pt/games/mahjong.json'
Cannot find module './id/games/marble-dash.json'
Cannot find module './de/games/ragdoll-hit-stickman.json'
Cannot find module './ja/games/save-dogs-from-bee-game.json'
...
```

## 根本原因

1. **缺失的翻译文件**: 英文目录 (en) 有 223 个游戏文件,但其他 17 个语言目录只有 218 个文件
2. **缺失的游戏**:
   - demo.json
   - mahjong.json
   - marble-dash.json
   - ragdoll-hit-stickman.json
   - save-dogs-from-bee-game.json

3. **配置不匹配**: `game-page-messages.json` 配置文件中列出了所有游戏路径,但实际文件不存在

## 已实施的修复

### 1. 补充缺失的游戏翻译文件
为所有 17 个语言目录复制了 5 个缺失的游戏文件:
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

### 2. 增加静态页面生成超时时间
修改 `next.config.ts`:
```typescript
// 从
staticPageGenerationTimeout: 1000,  // 1秒 - 太短!

// 改为
staticPageGenerationTimeout: 180,   // 180秒(3分钟)
```

这样可以防止在 Vercel 构建大量静态页面时超时。

### 3. 创建 Node 版本配置文件
创建 `.nvmrc` 文件指定 Node 20:
```
20
```

这确保 Vercel 使用正确的 Node 版本(package.json 中要求 >=20)。

### 4. 创建 Vercel 配置文件
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

### 1. 提交更改到 Git
```bash
git add .
git commit -m "fix: resolve Vercel deployment issues - add missing game translations and fix build config"
git push
```

### 2. 在 Vercel 中配置环境变量
在 Vercel 项目设置中添加环境变量:
- `UE_WEB_URL`: 设置为你的生产域名(例如: https://gamefreehub.com)

### 3. 触发重新部署
- 推送代码后,Vercel 会自动触发部署
- 或在 Vercel Dashboard 中手动触发重新部署

## 预防未来问题

1. **保持翻译文件同步**: 当添加新游戏时,确保为所有语言目录创建翻译文件
2. **使用脚本自动化**: 可以创建脚本来检查翻译文件的完整性
3. **监控构建时间**: 如果页面数量继续增加,可能需要进一步增加 `staticPageGenerationTimeout`

## 验证

所有语言目录现在都有相同数量的游戏文件:
```
en: 223 files
pt: 223 files
pt-BR: 223 files
id: 223 files
de: 223 files
ja: 223 files
vi: 223 files
th: 223 files
ko: 223 files
it: 223 files
uk: 223 files
zh-TW: 223 files
tr: 223 files
zh-CN: 223 files
es: 223 files
fr: 223 files
bn: 223 files
ru: 223 files
```

构建配置已优化,应该能够成功部署到 Vercel。
