const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// 配置
const CONFIG = {
  gamesDir: path.join(__dirname, '../app/[locale]/(public)/games'),
  outputDir: path.join(__dirname, '../public/game-covers'),
  width: 1280,
  height: 720,
  // 不同游戏类型的颜色主题
  themes: {
    'Action': { gradient: ['#FF6B6B', '#C92A2A'], icon: '⚔️', emoji: '\\u2694\\uFE0F' },
    'Adventure': { gradient: ['#51CF66', '#2F9E44'], icon: '🗺️', emoji: '\\uD83D\\uDDFA\\uFE0F' },
    'Puzzle': { gradient: ['#748FFC', '#5C7CFA'], icon: '🧩', emoji: '\\uD83E\\uDDE9' },
    'Racing': { gradient: ['#FF8787', '#FA5252'], icon: '🏎️', emoji: '\\uD83C\\uDFCE\\uFE0F' },
    'Sports': { gradient: ['#20C997', '#12B886'], icon: '⚽', emoji: '\\u26BD' },
    'Strategy': { gradient: ['#FCC419', '#FAB005'], icon: '🎯', emoji: '\\uD83C\\uDFAF' },
    'Casual': { gradient: ['#FF6B9D', '#E64980'], icon: '🎮', emoji: '\\uD83C\\uDFAE' },
    'IO': { gradient: ['#4DABF7', '#339AF0'], icon: '🌐', emoji: '\\uD83C\\uDF10' },
    'Shooter': { gradient: ['#FF922B', '#FD7E14'], icon: '🎯', emoji: '\\uD83C\\uDFAF' },
    'default': { gradient: ['#7950F2', '#6741D9'], icon: '🎮', emoji: '\\uD83C\\uDFAE' }
  }
};

// 确保输出目录存在
async function ensureOutputDir() {
  try {
    await mkdir(CONFIG.outputDir, { recursive: true });
    console.log(`✓ 输出目录已创建: ${CONFIG.outputDir}`);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

// 获取所有游戏配置
async function getAllGameConfigs() {
  const games = [];
  const gamesDir = CONFIG.gamesDir;

  if (!fs.existsSync(gamesDir)) {
    throw new Error(`游戏目录不存在: ${gamesDir}`);
  }

  const gameDirs = fs.readdirSync(gamesDir);

  for (const gameDir of gameDirs) {
    const configPath = path.join(gamesDir, gameDir, 'config/config.json');

    if (fs.existsSync(configPath)) {
      try {
        const content = await readFile(configPath, 'utf-8');
        const config = JSON.parse(content);

        games.push({
          name: gameDir,
          configPath,
          config,
        });
      } catch (error) {
        console.error(`✗ 读取配置失败 (${gameDir}):`, error.message);
      }
    }
  }

  return games;
}

// 格式化游戏标题
function formatGameTitle(gameName) {
  return gameName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// 根据游戏分类获取主题
function getThemeForGame(config) {
  if (!config.categories || config.categories.length === 0) {
    return CONFIG.themes.default;
  }

  const category = config.categories[0];

  for (const [key, theme] of Object.entries(CONFIG.themes)) {
    if (category.toLowerCase().includes(key.toLowerCase())) {
      return theme;
    }
  }

  if (config.name && config.name.endsWith('-io')) {
    return CONFIG.themes.IO;
  }

  return CONFIG.themes.default;
}

// 生成 SVG 封面
function generateSVGCover(game) {
  const { name, config } = game;
  const theme = getThemeForGame(config);
  const gameTitle = config.name || formatGameTitle(name);

  // 如果标题太长，缩短字体
  let titleFontSize = 72;
  if (gameTitle.length > 20) titleFontSize = 60;
  if (gameTitle.length > 30) titleFontSize = 48;

  const category = config.categories && config.categories.length > 0 ? config.categories[0].toUpperCase() : '';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CONFIG.width}" height="${CONFIG.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 主渐变 -->
    <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${theme.gradient[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${theme.gradient[1]};stop-opacity:1" />
    </linearGradient>

    <!-- 网格图案 -->
    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2"/>
    </pattern>
  </defs>

  <!-- 背景渐变 -->
  <rect width="${CONFIG.width}" height="${CONFIG.height}" fill="url(#mainGradient)"/>

  <!-- 网格 -->
  <rect width="${CONFIG.width}" height="${CONFIG.height}" fill="url(#grid)"/>

  <!-- 装饰圆圈 -->
  <circle cx="${CONFIG.width * 0.8}" cy="${CONFIG.height * 0.3}" r="200" fill="rgba(255,255,255,0.08)"/>
  <circle cx="${CONFIG.width * 0.2}" cy="${CONFIG.height * 0.7}" r="150" fill="rgba(255,255,255,0.08)"/>

  <!-- 中心卡片 -->
  <rect x="${CONFIG.width * 0.15}" y="${CONFIG.height * 0.25}"
        width="${CONFIG.width * 0.7}" height="${CONFIG.height * 0.5}"
        rx="30" fill="rgba(255,255,255,0.15)"
        filter="drop-shadow(0 20px 40px rgba(0,0,0,0.3))"/>

  <!-- 游戏图标 -->
  <text x="${CONFIG.width / 2}" y="${CONFIG.height / 2 - 60}"
        font-size="120" font-family="Arial, sans-serif"
        text-anchor="middle" fill="rgba(255,255,255,0.9)">${theme.icon}</text>

  <!-- 游戏标题 -->
  <text x="${CONFIG.width / 2}" y="${CONFIG.height / 2 + 80}"
        font-size="${titleFontSize}" font-weight="bold" font-family="Arial, sans-serif"
        text-anchor="middle" fill="#FFFFFF"
        filter="drop-shadow(0 5px 10px rgba(0,0,0,0.5))">${escapeXML(gameTitle)}</text>

  <!-- 分类标签 -->
  ${category ? `<text x="${CONFIG.width / 2}" y="${CONFIG.height / 2 + 140}"
        font-size="28" font-weight="bold" font-family="Arial, sans-serif"
        text-anchor="middle" fill="rgba(255,255,255,0.8)">${escapeXML(category)}</text>` : ''}

  <!-- 底部装饰线 -->
  <line x1="${CONFIG.width * 0.15 + 100}" y1="${CONFIG.height * 0.75 - 40}"
        x2="${CONFIG.width * 0.85 - 100}" y2="${CONFIG.height * 0.75 - 40}"
        stroke="rgba(255,255,255,0.3)" stroke-width="4"/>
</svg>`;

  return svg;
}

// XML 转义
function escapeXML(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// 更新游戏配置
async function updateGameConfig(configPath, newScreenshotUrl) {
  try {
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    config.screenshotUrl = newScreenshotUrl;
    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`  ✗ 更新配置失败:`, error.message);
    return false;
  }
}

// 处理单个游戏
async function processGame(game, index, total) {
  const { name, configPath, config } = game;

  console.log(`\n[${index + 1}/${total}] 处理游戏: ${name}`);

  // 检查SVG文件是否实际存在
  const svgFilePath = path.join(CONFIG.outputDir, `${name}.svg`);
  const svgExists = fs.existsSync(svgFilePath);

  // 检查是否需要生成（如果文件不存在，或者配置有问题，则需要生成）
  const needsGeneration = !svgExists ||
                          !config.screenshotUrl ||
                          config.screenshotUrl.includes('public-image.fafafa.ai');

  if (!needsGeneration) {
    console.log(`  ⊘ 跳过 (已有有效封面)`);
    return { success: true, skipped: true };
  }

  try {
    // 生成 SVG 封面
    console.log(`  生成 SVG 封面...`);
    const svg = generateSVGCover(game);

    // 保存为 SVG
    const outputPath = path.join(CONFIG.outputDir, `${name}.svg`);
    await writeFile(outputPath, svg, 'utf-8');
    console.log(`  ✓ 封面已保存: ${name}.svg`);

    // 更新配置
    const newScreenshotUrl = `/game-covers/${name}.svg`;
    const updateSuccess = await updateGameConfig(configPath, newScreenshotUrl);

    if (updateSuccess) {
      console.log(`  ✓ 配置已更新`);
    }

    return { success: updateSuccess, skipped: false };
  } catch (error) {
    console.error(`  ✗ 生成失败:`, error.message);
    return { success: false, skipped: false };
  }
}

// 主函数
async function main() {
  console.log('=================================');
  console.log('  游戏封面自动生成工具 (SVG)');
  console.log('  统一设计风格 + 自动配色');
  console.log('=================================\n');

  // 创建输出目录
  await ensureOutputDir();

  // 获取所有游戏
  console.log('正在扫描游戏...');
  const games = await getAllGameConfigs();
  console.log(`✓ 找到 ${games.length} 个游戏\n`);

  if (games.length === 0) {
    console.log('没有找到游戏，退出。');
    return;
  }

  // 统计
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  // 处理所有游戏
  for (let i = 0; i < games.length; i++) {
    const result = await processGame(games[i], i, games.length);
    processed++;
    if (result.skipped) {
      skipped++;
    } else if (result.success) {
      succeeded++;
    } else {
      failed++;
    }
  }

  // 输出统计
  console.log('\n=================================');
  console.log('  处理完成');
  console.log('=================================');
  console.log(`总计: ${processed} 个游戏`);
  console.log(`成功: ${succeeded} 个`);
  console.log(`失败: ${failed} 个`);
  console.log(`跳过: ${skipped} 个`);
  console.log(`\n✓ 封面已保存到: ${CONFIG.outputDir}`);
  console.log('✓ 配置文件已自动更新');
  console.log('\n注意: SVG 格式可缩放，体积小，适合 Web 使用');
}

// 运行
main().catch(error => {
  console.error('\n致命错误:', error);
  process.exit(1);
});
