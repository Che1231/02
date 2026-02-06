const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

// 配置
const CONFIG = {
  gamesDir: path.join(__dirname, '../app/[locale]/(public)/games'),
  coversDir: path.join(__dirname, '../public/game-covers'),
};

// 验证游戏和封面的一对一关系
async function validateGameCovers() {
  console.log('=================================');
  console.log('  游戏封面验证工具');
  console.log('  检查游戏和封面的对应关系');
  console.log('=================================\n');

  // 获取所有游戏目录
  const gameDirs = fs.readdirSync(CONFIG.gamesDir).filter(dir => {
    const dirPath = path.join(CONFIG.gamesDir, dir);
    return fs.statSync(dirPath).isDirectory();
  });

  // 获取所有SVG封面文件
  const coverFiles = fs.readdirSync(CONFIG.coversDir)
    .filter(file => file.endsWith('.svg'))
    .map(file => file.replace('.svg', ''));

  console.log(`✓ 找到 ${gameDirs.length} 个游戏`);
  console.log(`✓ 找到 ${coverFiles.length} 个SVG封面\n`);

  // 验证结果
  const results = {
    perfect: [],           // 完美匹配
    wrongUrl: [],          // URL不正确
    missingCover: [],      // 缺少封面文件
    missingConfig: [],     // 缺少配置
    extraCovers: [],       // 多余的封面
  };

  // 检查每个游戏
  for (const gameDir of gameDirs) {
    const configPath = path.join(CONFIG.gamesDir, gameDir, 'config/config.json');
    const coverPath = path.join(CONFIG.coversDir, `${gameDir}.svg`);
    const expectedUrl = `/game-covers/${gameDir}.svg`;

    // 检查配置文件
    if (!fs.existsSync(configPath)) {
      results.missingConfig.push(gameDir);
      continue;
    }

    // 读取配置
    let config;
    try {
      const content = await readFile(configPath, 'utf-8');
      config = JSON.parse(content);
    } catch (error) {
      results.missingConfig.push(`${gameDir} (读取失败)`);
      continue;
    }

    // 检查封面文件
    if (!fs.existsSync(coverPath)) {
      results.missingCover.push(gameDir);
      continue;
    }

    // 检查screenshotUrl
    if (config.screenshotUrl !== expectedUrl) {
      results.wrongUrl.push({
        game: gameDir,
        current: config.screenshotUrl,
        expected: expectedUrl,
      });
      continue;
    }

    // 完美匹配
    results.perfect.push(gameDir);
  }

  // 检查多余的封面
  for (const coverName of coverFiles) {
    if (!gameDirs.includes(coverName)) {
      results.extraCovers.push(coverName);
    }
  }

  // 输出结果
  console.log('=================================');
  console.log('  验证结果');
  console.log('=================================\n');

  console.log(`✓ 完美匹配: ${results.perfect.length} 个游戏`);

  if (results.wrongUrl.length > 0) {
    console.log(`\n⚠ screenshotUrl不正确: ${results.wrongUrl.length} 个`);
    results.wrongUrl.slice(0, 10).forEach(item => {
      console.log(`  - ${item.game}`);
      console.log(`    当前: ${item.current}`);
      console.log(`    应为: ${item.expected}`);
    });
    if (results.wrongUrl.length > 10) {
      console.log(`  ... 还有 ${results.wrongUrl.length - 10} 个`);
    }
  }

  if (results.missingCover.length > 0) {
    console.log(`\n✗ 缺少封面文件: ${results.missingCover.length} 个`);
    results.missingCover.slice(0, 10).forEach(game => {
      console.log(`  - ${game}`);
    });
    if (results.missingCover.length > 10) {
      console.log(`  ... 还有 ${results.missingCover.length - 10} 个`);
    }
  }

  if (results.missingConfig.length > 0) {
    console.log(`\n✗ 配置问题: ${results.missingConfig.length} 个`);
    results.missingConfig.forEach(game => {
      console.log(`  - ${game}`);
    });
  }

  if (results.extraCovers.length > 0) {
    console.log(`\n⚠ 多余的封面: ${results.extraCovers.length} 个`);
    results.extraCovers.forEach(cover => {
      console.log(`  - ${cover}.svg`);
    });
  }

  console.log('\n=================================');
  console.log('  总结');
  console.log('=================================');

  const totalIssues =
    results.wrongUrl.length +
    results.missingCover.length +
    results.missingConfig.length +
    results.extraCovers.length;

  if (totalIssues === 0) {
    console.log('✓ 所有游戏和封面完美匹配！');
    console.log(`✓ ${results.perfect.length}个游戏，每个都有对应的SVG封面`);
    console.log('✓ 所有screenshotUrl都指向正确的文件');
  } else {
    console.log(`⚠ 发现 ${totalIssues} 个问题需要修复`);
  }

  return results;
}

// 运行
validateGameCovers().catch(error => {
  console.error('\n致命错误:', error);
  process.exit(1);
});
