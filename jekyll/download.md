---
layout: post
title: 下载
name: Download
group: 'nav'
weight : 5
hideTitle: true
commentIssueId: 82
---
## 包内容

下载包中包含以下文件

```
├── Uploader.swf                      // SWF文件，当使用Flash运行时需要引入。

├── webuploader.js                    // 完全版本。
├── webuploader.min.js                // min版本

├── webuploader.flashonly.js          // 只有Flash实现的版本。
├── webuploader.flashonly.min.js      // min版本

├── webuploader.html5only.js          // 只有Html5实现的版本。
├── webuploader.html5only.min.js      // min版本

├── webuploader.withoutimage.js       // 去除图片处理的版本，包括HTML5和FLASH.
└── webuploader.withoutimage.min.js   // min版本
```

## 下载

直接下载本站默认打包版本，下载包中包含`源码版本`和`压缩版本`。

<a class="btn btn-success" href="https://github.com/fex-team/webuploader/releases">下载最新版本</a>

或者直接使用由[staticfile](http://www.staticfile.org/)提供的cdn版本，或者下载[Git项目包](https://github.com/fex-team/webuploader/zipball/master)。

```html
// SWF文件，当使用Flash运行时需要引入。
├── http://cdn.staticfile.org/webuploader/0.1.0/Uploader.swf

// 完全版本。
├── http://cdn.staticfile.org/webuploader/0.1.0/webuploader.js
├── http://cdn.staticfile.org/webuploader/0.1.0/webuploader.min.js

// 只有Flash实现的版本。
├── http://cdn.staticfile.org/webuploader/0.1.0/webuploader.flashonly.js
├── http://cdn.staticfile.org/webuploader/0.1.0/webuploader.flashonly.min.js

// 只有Html5实现的版本。
├── http://cdn.staticfile.org/webuploader/0.1.0/webuploader.html5only.js
├── http://cdn.staticfile.org/webuploader/0.1.0/webuploader.html5only.min.js

// 去除图片处理的版本，包括HTML5和FLASH.
├── http://cdn.staticfile.org/webuploader/0.1.0/webuploader.withoutimage.js
└── http://cdn.staticfile.org/webuploader/0.1.0/webuploader.withoutimage.min.js
```

## DIY打包

想更大力度的搭配JS，实现满足需求的最小组合，请按如下步骤进行操作。 文件打包借助了[Grunt](http://gruntjs.com/getting-started)工具来实现。
如果您还不知道什么是[Grunt](http://gruntjs.com/getting-started)，赶紧去了解一下吧。

### 环境依赖

1. git命令行工具
2. node & npm命令行工具
3. grunt (`npm install grunt-cli -g`)

### 编译代码
1. 克隆 [webuploader git仓库](https://github.com/fex-team/webuploader)，`git clone https://github.com/fex-team/webuploader.git`。
2. 安装node依赖，`npm install`。
3. 执行`grunt dist`，此动作会在dist目录下面创建合并版本的js, 包括通过`uglify`压缩的min版本。

### 配置
打开webuploader仓库根目录下面的`Gruntfile.js`文件, 代码合并有`build`task来完成。找到`build`配置项。

Gruntfile.js已经配置了一个自定义合并的demo. 打包只支持HTML5的版本。

```javascript
// 自己配置的实例
// glob语法。
custom: {
    preset: "custom",
    cwd: "src",
    src: [
        'widgets/**/*.js',
        'runtime/html5/**/*.js'
    ],
    dest: "dist/webuploader.custom.js"
}
```
