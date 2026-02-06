const { createCanvas, registerFont } = require('canvas');
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
    'Action': { gradient: ['#FF6B6B', '#C92A2A'], icon: '⚔️' },
    'Adventure': { gradient: ['#51CF66', '#2F9E44'], icon: '🗺️' },
    'Puzzle': { gradient: ['#748FFC', '#5C7CFA'], icon: '🧩' },
    'Racing': { gradient: ['#FF8787', '#FA5252'], icon: '🏎️' },
    'Sports': { gradient: ['#20C997', '#12B886'], icon: '⚽' },
    'Strategy': { gradient: ['#FCC419', '#FAB005'], icon: '🎯' },
    'Casual': { gradient: ['#FF6B9D', '#E64980'], icon: '🎮' },
    'IO': { gradient: ['#4DABF7', '#339AF0'], icon: '🌐' },
    'Shooter': { gradient: ['#FF922B', '#FD7E14'], icon: '🎯' },
    'default': { gradient: ['#7950F2', '#6741D9'], icon: '🎮' }
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

// 格式化游戏标题（去掉连字符，首字母大写）
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

  // 匹配主题
  for (const [key, theme] of Object.entries(CONFIG.themes)) {
    if (category.toLowerCase().includes(key.toLowerCase())) {
      return theme;
    }
  }

  // IO 游戏特殊处理
  if (config.name && config.name.endsWith('-io')) {
    return CONFIG.themes.IO;
  }

  return CONFIG.themes.default;
}

// 绘制圆角矩形
function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// 生成游戏封面
async function generateGameCover(game) {
  const { name, config } = game;
  const canvas = createCanvas(CONFIG.width, CONFIG.height);
  const ctx = canvas.getContext('2d');

  // 获取主题
  const theme = getThemeForGame(config);
  const gameTitle = config.name || formatGameTitle(name);

  // 绘制渐变背景
  const gradient = ctx.createLinearGradient(0, 0, CONFIG.width, CONFIG.height);
  gradient.addColorStop(0, theme.gradient[0]);
  gradient.addColorStop(1, theme.gradient[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  // 添加网格图案
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 2;
  const gridSize = 50;
  for (let x = 0; x < CONFIG.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CONFIG.height);
    ctx.stroke();
  }
  for (let y = 0; y < CONFIG.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CONFIG.width, y);
    ctx.stroke();
  }

  // 添加装饰性圆圈
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(CONFIG.width * 0.8, CONFIG.height * 0.3, 200, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(CONFIG.width * 0.2, CONFIG.height * 0.7, 150, 0, Math.PI * 2);
  ctx.fill();

  // 绘制中心卡片
  const cardWidth = CONFIG.width * 0.7;
  const cardHeight = CONFIG.height * 0.5;
  const cardX = (CONFIG.width - cardWidth) / 2;
  const cardY = (CONFIG.height - cardHeight) / 2;

  // 卡片阴影
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 20;

  // 卡片背景
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
  ctx.fill();

  // 重置阴影
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // 绘制图标
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(theme.icon, CONFIG.width / 2, CONFIG.height / 2 - 60);

  // 绘制游戏标题
  ctx.font = 'bold 72px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 标题阴影
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 5;

  // 如果标题太长，使用较小的字体
  let titleFontSize = 72;
  let titleText = gameTitle;

  // 测量文本宽度并调整
  ctx.font = `bold ${titleFontSize}px Arial`;
  let textWidth = ctx.measureText(titleText).width;

  while (textWidth > cardWidth - 100 && titleFontSize > 36) {
    titleFontSize -= 4;
    ctx.font = `bold ${titleFontSize}px Arial`;
    textWidth = ctx.measureText(titleText).width;
  }

  // 如果还是太长，截断并添加省略号
  if (textWidth > cardWidth - 100) {
    while (textWidth > cardWidth - 100 && titleText.length > 10) {
      titleText = titleText.slice(0, -1);
      textWidth = ctx.measureText(titleText + '...').width;
    }
    titleText += '...';
  }

  ctx.fillText(titleText, CONFIG.width / 2, CONFIG.height / 2 + 80);

  // 绘制分类标签（如果有）
  if (config.categories && config.categories.length > 0) {
    ctx.shadowColor = 'transparent';
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(config.categories[0].toUpperCase(), CONFIG.width / 2, CONFIG.height / 2 + 140);
  }

  // 添加底部装饰线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cardX + 100, cardY + cardHeight - 40);
  ctx.lineTo(cardX + cardWidth - 100, cardY + cardHeight - 40);
  ctx.stroke();

  return canvas;
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

  // 检查是否需要生成
  const needsGeneration = !config.screenshotUrl ||
                          config.screenshotUrl.includes('public-image.fafafa.ai');

  if (!needsGeneration) {
    console.log(`  ⊘ 跳过 (已有有效封面)`);
    return { success: true, skipped: true };
  }

  try {
    // 生成封面
    console.log(`  生成封面图片...`);
    const canvas = await generateGameCover(game);

    // 保存为 WebP
    const outputPath = path.join(CONFIG.outputDir, `${name}.webp`);
    const buffer = canvas.toBuffer('image/webp', { quality: 0.9 });
    await writeFile(outputPath, buffer);
    console.log(`  ✓ 封面已保存: ${name}.webp`);

    // 更新配置
    const newScreenshotUrl = `/game-covers/${name}.webp`;
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
  console.log('  游戏封面自动生成工具');
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
}

// 运行
main().catch(error => {
  console.error('\n致命错误:', error);
  process.exit(1);
});
