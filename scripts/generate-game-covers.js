const puppeteer = require('puppeteer');
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
  viewport: { width: 1280, height: 720 },
  waitTime: 5000, // 等待游戏加载的时间（毫秒）
  screenshotQuality: 90,
  concurrency: 3, // 同时处理的游戏数量
};

// 创建输出目录
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

// 截取游戏封面
async function captureGameCover(browser, gameIframeUrl, outputPath, gameName) {
  const page = await browser.newPage();

  try {
    await page.setViewport(CONFIG.viewport);

    console.log(`  访问游戏页面...`);
    await page.goto(gameIframeUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log(`  等待游戏加载 (${CONFIG.waitTime / 1000}秒)...`);
    await page.waitForTimeout(CONFIG.waitTime);

    console.log(`  正在截图...`);
    await page.screenshot({
      path: outputPath,
      type: 'webp',
      quality: CONFIG.screenshotQuality
    });

    console.log(`  ✓ 截图已保存: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`  ✗ 截图失败:`, error.message);
    return false;
  } finally {
    await page.close();
  }
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
async function processGame(browser, game, index, total) {
  const { name, configPath, config } = game;

  console.log(`\n[${index + 1}/${total}] 处理游戏: ${name}`);

  // 检查是否需要截图
  const needsScreenshot = !config.screenshotUrl ||
                          config.screenshotUrl.includes('public-image.fafafa.ai');

  if (!needsScreenshot) {
    console.log(`  ⊘ 跳过 (已有有效封面)`);
    return { success: true, skipped: true };
  }

  if (!config.gameIframeUrl) {
    console.log(`  ⊘ 跳过 (无 gameIframeUrl)`);
    return { success: false, skipped: true };
  }

  // 生成截图文件名和路径
  const screenshotFileName = `${name}.webp`;
  const screenshotPath = path.join(CONFIG.outputDir, screenshotFileName);

  // 截图
  const captureSuccess = await captureGameCover(
    browser,
    config.gameIframeUrl,
    screenshotPath,
    name
  );

  if (!captureSuccess) {
    return { success: false, skipped: false };
  }

  // 更新配置文件
  const newScreenshotUrl = `/game-covers/${screenshotFileName}`;
  const updateSuccess = await updateGameConfig(configPath, newScreenshotUrl);

  return { success: updateSuccess, skipped: false };
}

// 批量处理游戏（控制并发）
async function processBatch(browser, games, startIndex, batchSize) {
  const batch = games.slice(startIndex, startIndex + batchSize);
  const results = await Promise.all(
    batch.map((game, i) => processGame(browser, game, startIndex + i, games.length))
  );
  return results;
}

// 主函数
async function main() {
  console.log('=================================');
  console.log('  游戏封面自动生成工具');
  console.log('=================================\n');

  // 创建输出目录
  await ensureOutputDir();

  // 获取所有游戏配置
  console.log('正在扫描游戏...');
  const games = await getAllGameConfigs();
  console.log(`✓ 找到 ${games.length} 个游戏\n`);

  if (games.length === 0) {
    console.log('没有找到游戏，退出。');
    return;
  }

  // 启动浏览器
  console.log('正在启动浏览器...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  console.log('✓ 浏览器已启动\n');

  // 统计
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  try {
    // 分批处理游戏
    for (let i = 0; i < games.length; i += CONFIG.concurrency) {
      const results = await processBatch(browser, games, i, CONFIG.concurrency);

      results.forEach(result => {
        processed++;
        if (result.skipped) {
          skipped++;
        } else if (result.success) {
          succeeded++;
        } else {
          failed++;
        }
      });
    }
  } finally {
    await browser.close();
    console.log('\n✓ 浏览器已关闭');
  }

  // 输出统计
  console.log('\n=================================');
  console.log('  处理完成');
  console.log('=================================');
  console.log(`总计: ${processed} 个游戏`);
  console.log(`成功: ${succeeded} 个`);
  console.log(`失败: ${failed} 个`);
  console.log(`跳过: ${skipped} 个`);
  console.log('\n截图保存位置:', CONFIG.outputDir);
  console.log('配置文件已自动更新');
}

// 运行
main().catch(error => {
  console.error('\n致命错误:', error);
  process.exit(1);
});
