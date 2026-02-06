const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// 配置
const CONFIG = {
  gameBoxDir: path.join(__dirname, '../resources/game-box'),
};

// 从路径提取分类键
function getCategoryKey(categoryPath) {
  return categoryPath.replace('/c/', '');
}

// 获取新的图标路径
function getNewIconPath(categoryPath) {
  const categoryKey = getCategoryKey(categoryPath);
  return `/category-icons/${categoryKey}.svg`;
}

// 处理单个语言文件
async function processLanguageFile(filePath, fileName) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    if (!data.categories || !Array.isArray(data.categories)) {
      console.log(`  ⊘ 跳过 ${fileName} (无分类数据)`);
      return { success: true, updated: false };
    }

    let updated = false;

    // 更新每个分类的图标
    for (const category of data.categories) {
      if (category.icon && category.icon.includes('fafafa.ai')) {
        const newIconPath = getNewIconPath(category.path);
        category.icon = newIconPath;
        updated = true;
      }
    }

    if (updated) {
      await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`  ✓ 已更新: ${fileName}`);
      return { success: true, updated: true };
    } else {
      console.log(`  ⊘ 无需更新: ${fileName}`);
      return { success: true, updated: false };
    }
  } catch (error) {
    console.error(`  ✗ 处理失败 ${fileName}:`, error.message);
    return { success: false, updated: false };
  }
}

// 主函数
async function main() {
  console.log('=================================');
  console.log('  分类图标路径更新工具');
  console.log('  替换所有语言文件中的图标URL');
  console.log('=================================\n');

  // 获取所有JSON文件
  console.log('正在扫描语言文件...');
  const files = fs.readdirSync(CONFIG.gameBoxDir)
    .filter(file => file.endsWith('.json'));

  console.log(`✓ 找到 ${files.length} 个语言文件\n`);

  if (files.length === 0) {
    console.log('没有找到语言文件，退出。');
    return;
  }

  // 统计
  let processed = 0;
  let updated = 0;
  let failed = 0;

  // 处理所有文件
  for (const file of files) {
    console.log(`处理: ${file}`);
    const filePath = path.join(CONFIG.gameBoxDir, file);
    const result = await processLanguageFile(filePath, file);

    processed++;
    if (result.updated) updated++;
    if (!result.success) failed++;
  }

  // 输出统计
  console.log('\n=================================');
  console.log('  处理完成');
  console.log('=================================');
  console.log(`总计: ${processed} 个文件`);
  console.log(`更新: ${updated} 个`);
  console.log(`失败: ${failed} 个`);
  console.log(`跳过: ${processed - updated - failed} 个`);
  console.log('\n✓ 所有分类图标已更新为本地SVG路径');
}

// 运行
main().catch(error => {
  console.error('\n致命错误:', error);
  process.exit(1);
});
