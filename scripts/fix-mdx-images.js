const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// 配置
const CONFIG = {
  gamesDir: path.join(__dirname, '../app/[locale]/(public)/games'),
};

// 获取所有游戏目录
function getAllGameDirs() {
  const gamesDir = CONFIG.gamesDir;

  if (!fs.existsSync(gamesDir)) {
    throw new Error(`游戏目录不存在: ${gamesDir}`);
  }

  return fs.readdirSync(gamesDir).filter(dir => {
    const dirPath = path.join(gamesDir, dir);
    return fs.statSync(dirPath).isDirectory();
  });
}

// 处理单个MDX文件
async function processMDXFile(filePath, gameName) {
  try {
    let content = await readFile(filePath, 'utf-8');
    const originalContent = content;

    // 替换所有 fafafa 图片链接为对应游戏的 SVG 封面
    const coverPath = `/game-covers/${gameName}.svg`;

    // 匹配所有 img 标签中的 fafafa 图片
    content = content.replace(
      /src="https:\/\/public-image\.fafafa\.ai\/[^"]+"/g,
      `src="${coverPath}"`
    );

    // 如果内容有变化，写回文件
    if (content !== originalContent) {
      await writeFile(filePath, content, 'utf-8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`  ✗ 处理失败 (${path.basename(filePath)}):`, error.message);
    return false;
  }
}

// 处理单个游戏的所有MDX文件
async function processGame(gameName, index, total) {
  console.log(`\n[${index + 1}/${total}] 处理游戏: ${gameName}`);

  const gameFeaturesDir = path.join(CONFIG.gamesDir, gameName, 'config/features');

  if (!fs.existsSync(gameFeaturesDir)) {
    console.log(`  ⊘ 跳过 (无features目录)`);
    return { success: true, updated: 0 };
  }

  const mdxFiles = fs.readdirSync(gameFeaturesDir).filter(file => file.endsWith('.mdx'));

  if (mdxFiles.length === 0) {
    console.log(`  ⊘ 跳过 (无MDX文件)`);
    return { success: true, updated: 0 };
  }

  let updatedCount = 0;

  for (const mdxFile of mdxFiles) {
    const filePath = path.join(gameFeaturesDir, mdxFile);
    const updated = await processMDXFile(filePath, gameName);
    if (updated) {
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    console.log(`  ✓ 已更新 ${updatedCount} 个文件`);
  } else {
    console.log(`  ⊘ 无需更新`);
  }

  return { success: true, updated: updatedCount };
}

// 主函数
async function main() {
  console.log('=================================');
  console.log('  MDX图片链接修复工具');
  console.log('  替换fafafa图片为SVG封面');
  console.log('=================================\n');

  // 获取所有游戏
  console.log('正在扫描游戏...');
  const games = getAllGameDirs();
  console.log(`✓ 找到 ${games.length} 个游戏\n`);

  if (games.length === 0) {
    console.log('没有找到游戏，退出。');
    return;
  }

  // 统计
  let processed = 0;
  let totalUpdated = 0;

  // 处理所有游戏
  for (let i = 0; i < games.length; i++) {
    const result = await processGame(games[i], i, games.length);
    processed++;
    totalUpdated += result.updated;
  }

  // 输出统计
  console.log('\n=================================');
  console.log('  处理完成');
  console.log('=================================');
  console.log(`总计: ${processed} 个游戏`);
  console.log(`更新: ${totalUpdated} 个MDX文件`);
  console.log('\n✓ 所有fafafa图片引用已替换为对应游戏的SVG封面');
}

// 运行
main().catch(error => {
  console.error('\n致命错误:', error);
  process.exit(1);
});
