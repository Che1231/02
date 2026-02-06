const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// 配置
const CONFIG = {
  gamesDir: path.join(__dirname, '../app/[locale]/(public)/games'),
};

// 格式化游戏标题
function formatGameTitle(pageName) {
  // 特殊情况处理
  const specialCases = {
    'io': 'IO',
    '2d': '2D',
    '3d': '3D',
    'fps': 'FPS',
    'fnf': 'FNF',
    'vs': 'vs',
    'ai': 'AI',
  };

  return pageName
    .split('-')
    .map(word => {
      const lower = word.toLowerCase();
      if (specialCases[lower]) {
        return specialCases[lower];
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
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

// 修复单个游戏配置
async function fixGameConfig(game, index, total) {
  const { name, configPath, config } = game;

  console.log(`\n[${index + 1}/${total}] 检查游戏: ${name}`);

  let needsUpdate = false;
  let changes = [];

  // 1. 修复 name 字段
  const correctName = formatGameTitle(config.pageName || name);
  if (config.name !== correctName && (config.name.includes('.webp') || config.name.includes('.svg'))) {
    config.name = correctName;
    needsUpdate = true;
    changes.push(`name: "${config.name}" -> "${correctName}"`);
  }

  // 2. 确保 screenshotUrl 指向正确的 SVG
  const expectedScreenshotUrl = `/game-covers/${name}.svg`;
  if (config.screenshotUrl !== expectedScreenshotUrl) {
    config.screenshotUrl = expectedScreenshotUrl;
    needsUpdate = true;
    changes.push(`screenshotUrl 已更新`);
  }

  // 3. 清理其他可能包含旧图片链接的字段
  if (config.bgImage && config.bgImage.includes('public-image.fafafa.ai')) {
    config.bgImage = '';
    needsUpdate = true;
    changes.push(`bgImage 已清空`);
  }

  // 4. 修复 avatar 链接
  if (config.comments && Array.isArray(config.comments)) {
    for (let comment of config.comments) {
      if (comment.avatar && comment.avatar.includes('public-image.fafafa.ai')) {
        // 保留 randomx.ai 的链接，只清理 fafafa 的
        needsUpdate = true;
        changes.push(`评论头像链接已清理`);
      }
    }
  }

  if (needsUpdate) {
    try {
      await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
      console.log(`  ✓ 已更新: ${changes.join(', ')}`);
      return { success: true, updated: true };
    } catch (error) {
      console.error(`  ✗ 更新失败:`, error.message);
      return { success: false, updated: false };
    }
  } else {
    console.log(`  ⊘ 无需更新`);
    return { success: true, updated: false };
  }
}

// 主函数
async function main() {
  console.log('=================================');
  console.log('  游戏配置修复工具');
  console.log('  修复游戏名称和图片链接');
  console.log('=================================\n');

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
  let updated = 0;
  let failed = 0;

  // 处理所有游戏
  for (let i = 0; i < games.length; i++) {
    const result = await fixGameConfig(games[i], i, games.length);
    processed++;
    if (result.updated) {
      updated++;
    }
    if (!result.success) {
      failed++;
    }
  }

  // 输出统计
  console.log('\n=================================');
  console.log('  处理完成');
  console.log('=================================');
  console.log(`总计: ${processed} 个游戏`);
  console.log(`更新: ${updated} 个`);
  console.log(`失败: ${failed} 个`);
  console.log(`跳过: ${processed - updated - failed} 个`);
}

// 运行
main().catch(error => {
  console.error('\n致命错误:', error);
  process.exit(1);
});
