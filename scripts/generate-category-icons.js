const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// 配置
const CONFIG = {
  inputFile: path.join(__dirname, '../resources/game-box/en.json'),
  outputDir: path.join(__dirname, '../public/category-icons'),
  iconSize: 64,
  // 12个分类的配置
  categoryConfig: {
    'new-trending': {
      gradient: ['#FF6B6B', '#C92A2A'],
      emoji: '🔥',
      bgColor: '#FFE5E5'
    },
    'action-game': {
      gradient: ['#4DABF7', '#339AF0'],
      emoji: '⚔️',
      bgColor: '#D2E7FF'
    },
    'shooter-game': {
      gradient: ['#FF922B', '#FD7E14'],
      emoji: '🎯',
      bgColor: '#FFE8CC'
    },
    'multiplayer-game': {
      gradient: ['#20C997', '#12B886'],
      emoji: '👥',
      bgColor: '#C3FAE8'
    },
    'strategy-puzzle': {
      gradient: ['#748FFC', '#5C7CFA'],
      emoji: '🧩',
      bgColor: '#DBE4FF'
    },
    'simulation-idle': {
      gradient: ['#FCC419', '#FAB005'],
      emoji: '⚙️',
      bgColor: '#FFF3BF'
    },
    'rpg-adventure': {
      gradient: ['#51CF66', '#2F9E44'],
      emoji: '🗺️',
      bgColor: '#C1F8CF'
    },
    'sports-io': {
      gradient: ['#FF6B9D', '#E64980'],
      emoji: '⚽',
      bgColor: '#FFDEEB'
    },
    'driving-game': {
      gradient: ['#FF8787', '#FA5252'],
      emoji: '🏎️',
      bgColor: '#FFE3E3'
    },
    'sandbox-lite': {
      gradient: ['#94D82D', '#74B816'],
      emoji: '🏗️',
      bgColor: '#D8F5A2'
    },
    'card-classic': {
      gradient: ['#7950F2', '#6741D9'],
      emoji: '🃏',
      bgColor: '#E5DBFF'
    },
    'rhythm-voice': {
      gradient: ['#F06595', '#D6336C'],
      emoji: '🎵',
      bgColor: '#FFDEEB'
    }
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

// 生成分类图标 SVG
function generateCategoryIcon(categoryPath, config) {
  const size = CONFIG.iconSize;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient-${categoryPath}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${config.gradient[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${config.gradient[1]};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- 圆角矩形背景 -->
  <rect width="${size}" height="${size}" rx="12" fill="url(#gradient-${categoryPath})"/>

  <!-- 图标 -->
  <text x="${size / 2}" y="${size / 2 + 10}"
        font-size="32" font-family="Arial, sans-serif"
        text-anchor="middle" fill="#FFFFFF"
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${config.emoji}</text>
</svg>`;

  return svg;
}

// 从路径提取分类键
function getCategoryKey(categoryPath) {
  return categoryPath.replace('/c/', '');
}

// 主函数
async function main() {
  console.log('=================================');
  console.log('  分类图标自动生成工具 (SVG)');
  console.log('  统一设计风格 + 自动配色');
  console.log('=================================\n');

  // 创建输出目录
  await ensureOutputDir();

  // 读取分类数据
  console.log('正在读取分类数据...');
  const content = await readFile(CONFIG.inputFile, 'utf-8');
  const data = JSON.parse(content);
  const categories = data.categories || [];

  console.log(`✓ 找到 ${categories.length} 个分类\n`);

  if (categories.length === 0) {
    console.log('没有找到分类，退出。');
    return;
  }

  // 统计
  let generated = 0;
  let skipped = 0;

  // 生成所有分类图标
  for (const category of categories) {
    const categoryKey = getCategoryKey(category.path);
    const config = CONFIG.categoryConfig[categoryKey];

    if (!config) {
      console.log(`⚠ 跳过 ${category.name} (无配置: ${categoryKey})`);
      skipped++;
      continue;
    }

    console.log(`生成图标: ${category.name} (${categoryKey})`);

    // 生成 SVG
    const svg = generateCategoryIcon(categoryKey, config);

    // 保存
    const outputPath = path.join(CONFIG.outputDir, `${categoryKey}.svg`);
    await writeFile(outputPath, svg, 'utf-8');
    console.log(`  ✓ 已保存: ${categoryKey}.svg`);

    generated++;
  }

  // 输出统计
  console.log('\n=================================');
  console.log('  生成完成');
  console.log('=================================');
  console.log(`成功: ${generated} 个图标`);
  console.log(`跳过: ${skipped} 个`);
  console.log(`\n✓ 图标已保存到: ${CONFIG.outputDir}`);
}

// 运行
main().catch(error => {
  console.error('\n致命错误:', error);
  process.exit(1);
});
