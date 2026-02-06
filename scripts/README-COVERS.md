# 游戏封面自动生成工具

这个工具会自动为所有游戏生成封面图片，通过访问游戏的 iframe URL 并截取屏幕截图。

## 功能特性

- ✅ 自动扫描所有游戏配置
- ✅ 访问游戏页面并截取屏幕截图
- ✅ 保存为高质量 WebP 格式
- ✅ 自动更新配置文件中的 screenshotUrl
- ✅ 支持并发处理（默认同时处理 3 个游戏）
- ✅ 跳过已有有效封面的游戏
- ✅ 详细的进度输出和统计

## 安装依赖

首次使用前，需要安装 Puppeteer：

```bash
yarn install
```

或者单独安装 Puppeteer：

```bash
yarn add -D puppeteer
```

## 使用方法

### 快速开始

运行以下命令开始生成封面：

```bash
yarn generate-covers
```

### 脚本会做什么

1. **扫描游戏**：读取 `app/[locale]/(public)/games/` 下所有游戏的配置
2. **筛选游戏**：
   - 跳过已有有效封面的游戏
   - 跳过没有 `gameIframeUrl` 的游戏
   - 只处理使用 `public-image.fafafa.ai` 域名的游戏（这些图片已失效）
3. **访问并截图**：
   - 启动无头浏览器
   - 访问游戏的 iframe URL
   - 等待 5 秒让游戏加载
   - 截取 1280x720 的屏幕截图
4. **保存和更新**：
   - 将截图保存为 `public/game-covers/{游戏名}.webp`
   - 更新游戏配置中的 `screenshotUrl` 为 `/game-covers/{游戏名}.webp`

## 配置选项

你可以在 `scripts/generate-game-covers.js` 中修改以下配置：

```javascript
const CONFIG = {
  viewport: { width: 1280, height: 720 },  // 截图分辨率
  waitTime: 5000,                          // 等待游戏加载时间（毫秒）
  screenshotQuality: 90,                   // WebP 图片质量 (0-100)
  concurrency: 3,                          // 同时处理的游戏数量
};
```

## 输出结果

### 文件位置

- 📁 截图保存位置：`public/game-covers/`
- 📝 配置文件位置：`app/[locale]/(public)/games/{游戏名}/config/config.json`

### 执行统计

脚本完成后会显示：
- 总处理数量
- 成功数量
- 失败数量
- 跳过数量

示例输出：
```
=================================
  处理完成
=================================
总计: 222 个游戏
成功: 195 个
失败: 10 个
跳过: 17 个

截图保存位置: /path/to/public/game-covers
配置文件已自动更新
```

## 常见问题

### Q: 某些游戏截图失败了怎么办？

A: 可能的原因：
- 游戏页面加载时间过长（可以增加 `waitTime`）
- 游戏网站访问失败或需要特殊权限
- 游戏使用了防截图技术

可以手动为这些游戏创建封面，放到 `public/game-covers/` 目录下。

### Q: 如何调整截图质量？

A: 修改配置中的 `screenshotQuality` 参数（0-100）：
- 90-100：高质量，文件较大
- 70-89：平衡质量和文件大小（推荐）
- 50-69：较低质量，文件较小

### Q: 可以同时处理更多游戏吗？

A: 可以增加 `concurrency` 参数，但要注意：
- 过高的并发可能导致内存不足
- 建议不超过 5 个并发

### Q: 如何重新生成特定游戏的封面？

A: 有两种方法：
1. 删除 `public/game-covers/{游戏名}.webp`，然后重新运行脚本
2. 将该游戏配置中的 `screenshotUrl` 改为包含 `public-image.fafafa.ai` 的 URL

## 后续步骤

1. ✅ 运行脚本生成所有封面
2. ✅ 检查 `public/game-covers/` 目录中的截图
3. ✅ 手动替换质量不佳的截图
4. ✅ 提交代码到 git
5. ✅ 部署到 Vercel

## 注意事项

⚠️ **重要**：
- 首次运行会下载 Chromium（~170MB），这是 Puppeteer 的依赖
- 完整运行可能需要 20-60 分钟（取决于游戏数量）
- 确保有足够的磁盘空间（大约需要 200-500MB）
- 生成的截图会添加到 git，注意仓库大小

## 技术细节

- **浏览器**：Puppeteer + Chromium
- **图片格式**：WebP（支持有损压缩，体积小）
- **并发控制**：使用 Promise.all 批量处理
- **错误处理**：单个游戏失败不影响其他游戏

## 故障排除

### Puppeteer 安装失败

如果 Puppeteer 安装失败，可以设置环境变量跳过 Chromium 下载，然后手动安装：

```bash
# 跳过 Chromium 下载
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
yarn install

# 手动下载 Chromium
node node_modules/puppeteer/install.js
```

### 内存不足

减少并发数量或增加 Node.js 内存限制：

```bash
NODE_OPTIONS=--max-old-space-size=4096 yarn generate-covers
```

## 许可

此工具是项目的一部分，遵循项目许可协议。
