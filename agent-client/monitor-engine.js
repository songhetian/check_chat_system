// agent-client/monitor-engine.js
const { exec } = require('child_process');
const robot = require('robotjs');
const { ipcRenderer } = require('electron');

class MonitorEngine {
    constructor() {
        this.sensitiveWords = []; // 从服务端同步的词库
        this.isMonitoring = false;
        this.checkInterval = 500; // 每 500ms 检查一次焦点输入框
    }

    // 初始化词库
    updateWords(words) {
        this.sensitiveWords = words;
        console.log('词库已更新:', this.sensitiveWords.length, '个词汇');
    }

    // 启动监控
    start() {
        if (this.isMonitoring) return;
        this.isMonitoring = true;
        this.runLoop();
        console.log('底层监控引擎已启动...');
    }

    runLoop() {
        if (!this.isMonitoring) return;

        // 调用 C# 编写的微型 UIA 助手 (此处为逻辑模拟，实际会调用打包好的 exe)
        // 该助手会返回当前获得焦点的输入框文字
        this.getRawText((text) => {
            if (text) {
                this.analyze(text);
            }
            setTimeout(() => this.runLoop(), this.checkInterval);
        });
    }

    getRawText(callback) {
        // 在 Windows 生产环境下，通过执行底层的 UIA 探测程序获取文字
        exec('UIAHelper.exe --mode get-text', (err, stdout) => {
            if (!err) callback(stdout.trim());
            else callback(null);
        });
    }

    analyze(text) {
        const found = this.sensitiveWords.find(word => text.includes(word));
        if (found) {
            this.intervene(found, text);
        }
    }

    // 物理干预：执行删除
    intervene(word, fullText) {
        console.warn(`检测到敏感内容: [${word}]`);
        
        // 1. 模拟按键：全选并删除
        robot.keyTap('a', 'control');
        robot.keyTap('backspace');

        // 2. 通知 UI 层显示警告
        ipcRenderer.send('violation-detected', {
            word: word,
            message: '由于包含敏感词汇，内容已自动拦截并清除。'
        });

        // 3. 上报给服务端记录
        this.reportViolation(word, fullText);
    }

    reportViolation(word, content) {
        // 通过 Socket 发送给服务端
        // socket.emit('log-monitor', { word, content });
    }
}

module.exports = new MonitorEngine();
