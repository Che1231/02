const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// 配置
const CONFIG = {
  recommendationDir: path.join(__dirname, '../resources/recommendation'),
};

// 从游戏URL提取游戏名称
function getGameSlugFromUrl(url) {
  // URL格式: /games/game-name
  const match = url.match(/\/games\/([^/?]+)/);
  return match ? match[1] : null;
}

// 处理单个推荐文件
async function processRecommendationFile(filePath, fileName) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const games = JSON.parse(content);

    if (!Array.isArray(games)) {
      console.log(`  ⊘ 跳过 ${fileName} (无效格式)`);
      return { success: true, updated: false, count: 0 };
    }

    let updatedCount = 0;

    // 更新每个游戏的封面
    for (const game of games) {
      if (game.cover && game.cover.includes('fafafa.ai')) {
        const gameSlug = getGameSlugFromUrl(game.url);
        if (gameSlug) {
          game.cover = `/game-covers/${gameSlug}.svg`;
          updatedCount++;
        }
      }
    }

    if (updatedCount > 0) {
      await writeFile(filePath, JSON.stringify(games, null, 2), 'utf-8');
      console.log(`  ✓ 已更新: ${fileName} (${updatedCount} 个游戏)`);
      return { success: true, updated: true, count: updatedCount };
    } else {
      console.log(`  ⊘ 无需更新: ${fileName}`);
      return { success: true, updated: false, count: 0 };
    }
  } catch (error) {
    console.error(`  ✗ 处理失败 ${fileName}:`, error.message);
    return { success: false, updated: false, count: 0 };
  }
}

// 主函数
async function main() {
  console.log('=================================');
  console.log('  推荐游戏封面修复工具');
  console.log('  替换所有推荐文件中的图片URL');
  console.log('=================================\n');

  // 获取所有JSON文件
  console.log('正在扫描推荐文件...');
  const files = fs.readdirSync(CONFIG.recommendationDir)
    .filter(file => file.endsWith('.json'));

  console.log(`✓ 找到 ${files.length} 个推荐文件\n`);

  if (files.length === 0) {
    console.log('没有找到推荐文件，退出。');
    return;
  }

  // 统计
  let processed = 0;
  let updated = 0;
  let failed = 0;
  let totalGameUpdates = 0;

  // 处理所有文件
  for (const file of files) {
    console.log(`处理: ${file}`);
    const filePath = path.join(CONFIG.recommendationDir, file);
    const result = await processRecommendationFile(filePath, file);

    processed++;
    if (result.updated) updated++;
    if (!result.success) failed++;
    totalGameUpdates += result.count;
  }

  // 输出统计
  console.log('\n=================================');
  console.log('  处理完成');
  console.log('=================================');
  console.log(`总计: ${processed} 个文件`);
  console.log(`更新: ${updated} 个文件`);
  console.log(`失败: ${failed} 个`);
  console.log(`跳过: ${processed - updated - failed} 个`);
  console.log(`游戏封面更新数: ${totalGameUpdates} 个`);
  console.log('\n✓ 所有推荐游戏封面已更新为本地SVG路径');
}

// 运行
main().catch(error => {
  console.error('\n致命错误:', error);
  process.exit(1);
});
