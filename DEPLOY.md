# 高三复习系统 - 部署指南

## 功能概览

- 学生端：刷题练习、错题本、知识点复习、模拟考试、学习计划、学习计时打卡
- 家长监督：学习统计、一键导出周报、每日学习时长/做题量/正确率
- 全平台适配：电脑、安卓手机、iPhone X/11
- 深色/浅色模式切换
- 数据本地存储，断网可用

## 一、生成PWA图标（一次性）

1. 在项目目录运行 `npm run dev`
2. 浏览器打开后，在控制台执行：
   ```js
   import('/src/generateIcons.ts').then(m => m.generatePWAIcons())
   ```
3. 下载的 `icon-192.png` 和 `icon-512.png` 放到 `public/icons/` 目录

## 二、本地运行

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 三、部署到 Vercel（推荐，免费）

1. 注册 [Vercel](https://vercel.com) 账号
2. 安装 Vercel CLI：`npm i -g vercel`
3. 在项目目录执行：
   ```bash
   npm run build
   vercel --prod
   ```
4. 按提示操作，完成后获得访问链接

## 四、部署到 Netlify（备选）

1. 注册 [Netlify](https://netlify.com) 账号
2. 在项目目录执行：
   ```bash
   npm run build
   npx netlify deploy --prod --dir=dist
   ```

## 五、部署到 GitHub Pages

1. 在 GitHub 创建仓库
2. 推送代码
3. 在仓库 Settings → Pages，选择 `gh-pages` 分支
4. 使用 GitHub Actions 自动部署（见下方配置）

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 六、iPhone 添加到主屏幕

1. 用 Safari 打开部署后的链接
2. 点击底部「分享」按钮（方框+箭头图标）
3. 选择「添加到主屏幕」
4. 输入名称，点击「添加」
5. 桌面上会出现App图标，打开后全屏无浏览器栏

## 七、修改访问密码

默认密码：`2024`

在 `src/components/PasswordLock.tsx` 中修改 `DEFAULT_PASSWORD` 常量。

## 八、自定义域名（可选）

在 Vercel/Netlify 控制台中绑定自己的域名。

---

## 技术栈

- React 18 + TypeScript
- Vite 构建
- Tailwind CSS 样式（深色模式）
- IndexedDB 本地存储（离线可用）
- PWA 渐进式网页应用

## 页面说明

| 页面 | 功能 |
|------|------|
| 概览 | 学习数据总览、快捷入口 |
| 刷题 | 按科目/难度/题型筛选练习 |
| 计时 | 学习计时打卡、记录学习时长 |
| 知识 | 知识点按章节浏览 |
| 错题 | 错题本、错题复习 |
| 考试 | 模拟考试、答题卡 |
| 计划 | 学习计划制定与追踪 |
| 分析 | 成绩趋势、雷达图 |
| 监督 | 家长监督、周报导出 |
| 题库 | 题目管理、导入导出 |
