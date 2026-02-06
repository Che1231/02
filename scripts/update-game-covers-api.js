const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// 配置
const CONFIG = {
  gamesDir: path.join(__dirname, '../app/[locale]/(public)/games'),
  // 使用 Microlink 免费截图 API
  screenshotApiBase: 'https://api.microlink.io',
};

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

// 生成截图 URL（使用 Microlink API）
function generateScreenshotUrl(gameIframeUrl) {
  const params = new URLSearchParams({
    url: gameIframeUrl,
    screenshot: 'true',
    meta: 'false',
    embed: 'screenshot.url',
    viewport: '1280x720',
    type: 'webp',
  });

  return `${CONFIG.screenshotApiBase}?${params.toString()}`;
}

// 更新游戏配置中的 screenshotUrl
async function updateGameConfig(configPath, newScreenshotUrl) {
  try {
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content);

    config.screenshotUrl = newScreenshotUrl;

    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`  ✓ 配置已更新`);
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

  // 检查是否需要更新
  const needsUpdate = !config.screenshotUrl ||
                      config.screenshotUrl.includes('public-image.fafafa.ai');

  if (!needsUpdate) {
    console.log(`  ⊘ 跳过 (已有有效封面)`);
    return { success: true, skipped: true };
  }

  if (!config.gameIframeUrl) {
    console.log(`  ⊘ 跳过 (无 gameIframeUrl)`);
    return { success: false, skipped: true };
  }

  // 生成截图 API URL
  const screenshotUrl = generateScreenshotUrl(config.gameIframeUrl);
  console.log(`  生成截图 URL: ${screenshotUrl}`);

  // 更新配置文件
  const updateSuccess = await updateGameConfig(configPath, screenshotUrl);

  return { success: updateSuccess, skipped: false };
}

// 主函数
async function main() {
  console.log('=================================');
  console.log('  游戏封面 URL 更新工具');
  console.log('  使用 Microlink 截图 API');
  console.log('=================================\n');

  // 获取所有游戏配置
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
  console.log('\n✓ 配置文件已更新');
  console.log('✓ 封面将通过 Microlink API 动态生成');
  console.log('\n注意: Microlink 免费 API 有速率限制');
  console.log('如需稳定服务，建议后续迁移到自建截图服务');
}

// 运行
main().catch(error => {
  console.error('\n致命错误:', error);
  process.exit(1);
});
