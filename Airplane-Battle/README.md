# ✈️ 飞机大战 / Airplane Battle

`Games` 仓库中的第一款小游戏：一个使用原生 HTML、CSS 与 JavaScript Canvas 制作的街机射击游戏，无需安装依赖即可运行。

## 游戏内容

玩家驾驶战机持续向前作战，需要击落敌机、躲避敌方火力并尽可能刷新最高分。随着分数提升，等级和敌人强度会逐渐增加。

### 已实现

- 玩家飞机移动与连续射击
- 普通敌机、Z 字机动敌机、重型敌机
- 敌机追踪射击
- 碰撞检测、生命值与受击无敌时间
- 动态等级和难度提升
- 双发、护盾、加命三种道具
- 爆炸粒子与屏幕震动效果
- 星空滚动背景
- Web Audio API 合成音效
- 本地最高分记录
- 桌面键盘操作
- 手机拖动操作与自动射击
- 响应式界面

## 操作方式

| 操作 | 按键 |
| --- | --- |
| 移动 | `WASD` / 方向键 |
| 射击 | `Space` |
| 暂停 / 继续 | `P` |
| 游戏结束后重开 | `R` |
| 静音 | `M` |

手机端按住并拖动飞机即可移动，拖动期间会自动射击。

## 运行游戏

进入本目录后直接打开：

```text
index.html
```

也可以在仓库根目录启动一个本地静态服务器：

```bash
python3 -m http.server 8080
```

然后访问：

```text
http://localhost:8080/Airplane-Battle/
```

## 文件结构

```text
Airplane-Battle/
├── README.md
├── index.html
├── style.css
└── game.js
```

## 技术栈

- HTML5
- CSS3
- JavaScript
- Canvas API
- Web Audio API
- localStorage

## 后续可以增加

- Boss 战
- 更多敌机和武器
- 技能系统
- 更完整的音效与背景音乐
- 成就与排行榜
- 不同地图和关卡

[← 返回 Games 首页](../README.md)