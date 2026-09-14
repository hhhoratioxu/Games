# 🎮 Games

这里是我的小游戏合集仓库，用来集中整理、维护和持续更新我制作的各种游戏项目。

除了 GitHub 仓库本身，根目录还提供一个 `index.html` 游戏大厅页面。部署到 GitHub Pages 或其他静态托管平台后，可以直接从网页选择并进入不同游戏。

每个游戏都会放在独立文件夹中，互不干扰。进入对应游戏目录后，可以查看该游戏自己的介绍、玩法、操作方式和源代码。

## 网页入口

- 游戏大厅：`index.html`
- 飞机大战：`Airplane-Battle/index.html`

## 游戏列表

| 游戏 | 类型 | 状态 | 入口 |
| --- | --- | --- | --- |
| ✈️ 飞机大战 / Airplane Battle | Arcade / 射击 | ✅ 可玩 | [进入游戏目录](./Airplane-Battle/) |

## 仓库结构

```text
Games/
├── index.html             # 网页游戏大厅，可直接选择游戏
├── README.md              # Games 项目总介绍
├── LICENSE
├── Airplane-Battle/       # 飞机大战
│   ├── README.md          # 游戏介绍与玩法
│   ├── index.html         # 游戏入口
│   ├── style.css
│   └── game.js
└── ...                    # 以后继续添加更多游戏
```

## 规划

这个仓库会继续加入更多小游戏。每个新游戏都使用独立目录，并保留自己的说明文档和运行文件，同时在根目录游戏大厅添加对应卡片，让访问者可以直接点击进入游玩。

## 技术

不同游戏可能会使用不同技术，包括：

- HTML / CSS / JavaScript
- Canvas
- Web Audio API
- 其他适合小游戏开发的 Web 技术

## License

本仓库代码默认采用 MIT License；如果某个游戏有单独的授权说明，则以该游戏目录中的说明为准。

---

Made by Horatio Xu.