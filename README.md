# ✈️ 飞机大战 / Airplane Battle

一个纯前端、无需安装依赖的 Canvas 飞机大战小游戏。打开 `index.html` 即可游玩，也可以直接部署到 GitHub Pages、Cloudflare Pages、Vercel 等静态托管平台。

## 功能

- 玩家飞机移动与连续射击
- 三种敌机：普通、Z 字机动、重型敌机
- 敌机追踪射击
- 碰撞检测、生命值、无敌帧
- 动态难度与等级系统
- 双发、护盾、加命三种道具
- 粒子爆炸、屏幕震动、星空滚动背景
- Web Audio 合成音效，无需外部音频资源
- 本地最高分保存（`localStorage`）
- 键盘、鼠标 / 触控操作
- 响应式界面，电脑和手机均可游玩

## 操作

| 操作 | 按键 |
| --- | --- |
| 移动 | `WASD` / 方向键 |
| 射击 | `Space` |
| 暂停 / 继续 | `P` |
| 游戏结束后重开 | `R` |
| 静音 | `M` |

手机端：按住并拖动飞机即可移动，同时会自动射击。

## 运行

最简单的方法：

1. 下载或克隆本仓库。
2. 直接双击打开 `index.html`。

也可以启动任意静态 Web Server，例如：

```bash
python3 -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

## 项目结构

```text
airplane-battle-game/
├── index.html
├── style.css
├── game.js
└── README.md
```

## GitHub Pages

如果此项目位于独立仓库：

1. 打开仓库 `Settings`
2. 进入 `Pages`
3. `Build and deployment` 选择 `Deploy from a branch`
4. 选择 `main` 与 `/ (root)`
5. 保存后等待 GitHub Pages 生成访问地址

## License

MIT
