# NVRC Badminton Court Booking Scraper & Monitor

这是一个用于抓取北温康乐与文化局 (NVRC) 官方预订门户网站 (PerfectMind) 上羽毛球场地预订状态的 Python 爬虫。它支持按场馆位置、星期几及空余状态进行过滤和筛选，支持持续后台监控，并在检测到空余场地时自动发送邮件提醒。

本项目支持**本地运行**或**通过 GitHub Actions 进行 24 小时云端免费部署监控**。

---

## ☁️ GitHub Actions 云端部署教程 (推荐)

使用 GitHub Actions 可以在云端完全免费、免开机地进行 24 小时监控。敏感信息（如发信邮箱密码）会安全地保存在 GitHub 仓库的 Secrets 中，不会泄露。

### 1. 在 GitHub 上新建一个私有仓库
1. 访问 [GitHub](https://github.com/) 并登录您的账号 `VinciCantCode`。
2. 点击右上角的 **`+`** 按钮，选择 **New repository**。
3. 输入仓库名称（例如 `badminton-booking`）。
4. **【重要】** 权限选择为 **Private（私有）**，确保您的代码和去重记录不公开。
5. 不要勾选 "Add a README file"、"Add .gitignore" 等，直接点击 **Create repository**。

### 2. 将本地代码推送到 GitHub 仓库
在本地项目目录（`D:\Coding\badminton-booking`）下打开 PowerShell，依次运行以下命令：

```powershell
# 初始化本地 Git 仓库
git init

# 添加所有文件（本地 config.json 和 .venv 已被 .gitignore 自动忽略，非常安全）
git add .

# 提交代码
git commit -m "Initial commit"

# 关联远程仓库并推送 (请将下方 VinciCantCode 后的仓库名替换为您实际创建的名字)
git branch -M main
git remote add origin https://github.com/VinciCantCode/badminton-booking.git
git push -u origin main
```

### 3. 配置 GitHub Secrets (加密密钥)
由于 `config.json` 包含明文密码且不会推送到云端，我们需要将发信参数保存在 GitHub 的环境变量中：
1. 在 GitHub 仓库页面，点击右上角的 **Settings** 标签。
2. 在左侧菜单中，依次展开 **Secrets and variables** -> 点击 **Actions**。
3. 点击 **New repository secret** 按钮，添加以下 3 个 Key-Value 键值对：
   * **`SENDER_EMAIL`**: `zenith.peak77@gmail.com`
   * **`SENDER_PASSWORD`**: `yclwqjkzztfjtlzu` （您的 Google 应用专用密码，不要带空格）
   * **`RECEIVER_EMAIL`**: `zenith.peak77@gmail.com`
   * *(可选)* 若使用其他发信服务器，可添加 `SMTP_SERVER` 和 `SMTP_PORT`，默认会自动使用 Gmail。

### 4. 授予 GitHub Actions 写入权限 (用于保存去重文件)
为了让监控系统记住已发送的提醒，需要允许它将去重文件 `sent_alerts.json` 自动更新并保存回仓库：
1. 仍在 **Settings** 页面，点击左侧菜单的 **Actions** -> 点击 **General**。
2. 页面向下滚动到 **Workflow permissions**（工作流权限）区域。
3. 选中 **Read and write permissions**（读取和写入权限）。
4. 点击 **Save** 保存。

### 5. 开启与手动测试
1. 在仓库页面顶部点击 **Actions** 标签。
2. 看到左侧的 **🏸 NVRC Badminton Monitor** 任务，点击它。
3. 页面右侧会出现一个 **Run workflow** 按钮，点击它即可弹出自定义参数面板：
   - 您可以输入需要筛选的场馆（如 `Delbrook`）。
   - 勾选或去勾选参数。
   - 点击绿色的 **Run workflow** 按钮，即可立即触发一次云端抓取。
4. **自动运行**：工作流配置中设定了 `schedule: - cron: '*/10 * * * *'`，表示云端每隔 10 分钟会自动为您运行一次，实现 24 小时全天候监控。如果您想暂停，只需点击 `...` -> 选择 **Disable workflow** 即可。

---

## 💻 本地运行教程

如果您依然想在本地运行或测试：

### 1. 搭建虚拟环境并安装依赖
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. 本地配置 `config.json`
在根目录下创建 `config.json`：
```json
{
  "smtp_server": "smtp.gmail.com",
  "smtp_port": 587,
  "sender_email": "zenith.peak77@gmail.com",
  "sender_password": "yclwqjkzztfjtlzu",
  "receiver_email": "zenith.peak77@gmail.com",
  "monitor_interval_seconds": 300
}
```

### 3. 本地运行命令示例
* **单次运行（过滤您的日程且仅显示有空位场次）**：
  ```bash
  python scraper.py --my-schedule --available
  ```
* **本地持续监控模式**：
  ```bash
  python scraper.py --my-schedule --available --monitor
  ```
