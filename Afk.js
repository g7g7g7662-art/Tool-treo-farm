const mineflayer = require('mineflayer');
const chalk = require('chalk');
const readline = require('readline');
const fs = require('fs');

const CONFIG_FILE = 'config.json';
let data = { accounts: [], selectedIndex: -1 };

if (fs.existsSync(CONFIG_FILE)) {
    try { 
        let savedData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); 
        if (savedData.accounts && Array.isArray(savedData.accounts)) data = savedData;
        if (typeof savedData.selectedIndex === 'number') data.selectedIndex = savedData.selectedIndex;
    } catch (e) {}
}

function saveConfig() { fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf8'); }
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function showMenu() {
    console.clear();
    console.log(chalk.blue.bold('Created by: ') + chalk.bgCyan.black(' @dkhanh ') + chalk.blue.bold(' - Tool treo AFK ở Base [Bản Sạch]'));
    console.log(chalk.gray('===============================================\n'));
    
    console.log(chalk.yellow(`Danh sách tài khoản đã thêm (${data.accounts.length}):`));
    if (data.accounts.length === 0) {
        console.log(chalk.red(' [!] Chưa có tài khoản nào. Hãy dùng lệnh Add để thêm!'));
    } else {
        data.accounts.forEach((acc, index) => {
            let selectedMark = (index === data.selectedIndex) ? chalk.cyan(' -> [Đang chọn]') : '';
            let targetMain = acc.mainAccount ? ` | TPA -> ${acc.mainAccount}` : ' | Chưa gán nick chính';
            console.log(chalk.white(`[${index + 1}]: `) + chalk.green(acc.username) + chalk.gray(`  (Proxy: ${acc.proxy}${targetMain})`) + selectedMark);
        });
    }
    console.log('');

    console.log(chalk.cyan('Tài khoản đã chọn:'));
    if (data.selectedIndex === -1 || !data.accounts[data.selectedIndex]) {
        console.log(chalk.red(' [!] Chưa chọn tài khoản nào để chạy. Hãy gõ lệnh Acc!\n'));
    } else {
        const currentAcc = data.accounts[data.selectedIndex];
        const targetStr = currentAcc.mainAccount ? `TPA -> ${currentAcc.mainAccount}` : 'Chưa gán nick chính';
        console.log(chalk.white(`[${data.selectedIndex + 1}]: `) + chalk.green(currentAcc.username) + chalk.gray(` (Proxy | ${targetStr})`) + '\n');
    }

    console.log(chalk.magenta('- Nhập ') + chalk.green("'Add <tên_bot> <mật_khẩu>'") + chalk.magenta(' để thêm tài khoản mới'));
    console.log(chalk.magenta('- Nhập ') + chalk.green("'Acc <số_thứ_tự> <tên_acc_chính>'") + chalk.magenta(' để chọn bot và gán nick chính nhận TPA'));
    console.log(chalk.magenta('- Nhập ') + chalk.green("'Proxy <số_thứ_tự> <ip:port>'") + chalk.magenta(' để cài proxy cho acc'));
    console.log(chalk.magenta('- Nhập ') + chalk.green("'Run'") + chalk.magenta(' để chạy bot đang chọn'));
    console.log(chalk.magenta('- Nhập ') + chalk.green("'Exit'") + chalk.magenta(' để thoát\n'));
    
    askCommand();
}

function askCommand() {
    rl.question(chalk.white('Termux-Bot> '), (command) => {
        const parts = command.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();

        if (cmd === 'exit') process.exit();
        else if (cmd === 'add') {
            if (parts.length < 3) { console.log(chalk.red('\nSai cú pháp!')); setTimeout(showMenu, 1500); }
            else {
                data.accounts.push({ username: parts[1], password: parts[2], proxy: 'Chưa cài', mainAccount: '' });
                if (data.accounts.length === 1) data.selectedIndex = 0;
                saveConfig(); showMenu();
            }
        } 
        else if (cmd === 'acc') {
            const idx = parseInt(parts[1]) - 1; const mainName = parts[2];
            if (isNaN(idx) || idx < 0 || idx >= data.accounts.length || !mainName) { setTimeout(showMenu, 1500); }
            else { data.selectedIndex = idx; data.accounts[idx].mainAccount = mainName; saveConfig(); showMenu(); }
        }
        else if (cmd === 'proxy') {
            const idx = parseInt(parts[1]) - 1; const proxyStr = parts[2];
            if (isNaN(idx) || idx < 0 || idx >= data.accounts.length || !proxyStr) { setTimeout(showMenu, 1500); }
            else { data.accounts[idx].proxy = proxyStr; saveConfig(); showMenu(); }
        } 
        else if (cmd === 'run') {
            if (data.selectedIndex === -1) { setTimeout(showMenu, 1500); }
            else { startBot(data.accounts[data.selectedIndex]); }
        } 
        else { showMenu(); }
    });
}

function startBot(acc) {
    const logName = acc.username.substring(0, acc.username.length - 3) + 'xxx';
    
    console.log(chalk.white(`\n-> Starting: ${acc.username} | Proxy: ${acc.proxy}`));
    console.log(chalk.white(`[${logName}]: 📍 Địa chỉ máy chủ được chọn: sgp.kingmc.vn`));

    let botOptions = { host: 'sgp.kingmc.vn', port: 25565, username: acc.username, version: '1.16.5' };

    if (acc.proxy && acc.proxy !== 'Chưa cài') {
        try {
            const proxyAgent = require('proxy-agent');
            botOptions.agent = proxyAgent(`http://${acc.proxy}`);
            console.log(chalk.cyan(`[${logName}]: ✔ Đã luồn qua HTTP Proxy thành công...`));
        } catch (e) {
            console.log(chalk.red(`[${logName}]: Lỗi Proxy!`));
        }
    }

    const bot = mineflayer.createBot(botOptions);
    bot.hasGoneToSMP = false; 
    
    let menuInterval = null;
    let tpaInterval = null;

    // --- CHỨC NĂNG 1: VÒNG LẶP MỞ ĐỒNG HỒ Ở SẢNH HUB ---
    function startMenuLoop() {
        if (bot.hasGoneToSMP) return; // Nếu đã sang cụm chính thì bỏ qua hoàn toàn
        
        console.log(chalk.yellow(`[${logName}]: ⏳ [ĐỢI 3 GIÂY] tiến hành mở menu sảnh HUB...`));
        
        setTimeout(() => {
            if (bot.hasGoneToSMP) return;
            
            // Lần đầu kích hoạt mở menu
            console.log(chalk.white(`[${logName}]: ⚡ Thực hiện click Đồng hồ lần 1...`));
            bot.setQuickBarSlot(4);
            bot.activateItem();

            // Cứ mỗi 5 giây tiếp theo, nếu chưa qua sảnh thì bấm lại tiếp
            menuInterval = setInterval(() => {
                if (!bot.hasGoneToSMP) {
                    console.log(chalk.red(`[${logName}]: ⚠️ Thử lại sau 5 giây: Đang mở lại menu đồng hồ...`));
                    bot.setQuickBarSlot(4);
                    bot.activateItem();
                } else {
                    clearInterval(menuInterval);
                }
            }, 5000);
        }, 3000);
    }

    // --- CHỨC NĂNG 2: VÒNG LẶP GỬI LỆNH TPA MỖI 5 GIÂY ---
    function startTpaLoop() {
        if (tpaInterval) clearInterval(tpaInterval);
        
        console.log(chalk.cyan(`[${logName}]: ⚡ Bắt đầu kích hoạt chuỗi gửi lệnh TPA mỗi 5 giây...`));
        
        tpaInterval = setInterval(() => {
            bot.chat(`/tpa ${acc.mainAccount}`);
            console.log(chalk.white(`[${logName}]: 🚀 Đã gõ lệnh gửi yêu cầu dịch chuyển: /tpa ${acc.mainAccount}`));
        }, 5000);
    }

    function stopTpaLoop() {
        if (tpaInterval) {
            clearInterval(tpaInterval);
            tpaInterval = null;
            console.log(chalk.green(`[${logName}]: ✔ TPA thành công hoặc đã tới đích. Đang giữ bot đứng yên!`));
        }
    }

    bot.on('message', (jsonMsg) => {
        const msg = jsonMsg.toString().trim();
        if (!msg) return;
        
        console.log(chalk.white(`[${logName}]: [KHUNG CHAT]: `) + chalk.gray(msg));

        // Nếu có tin nhắn xác nhận chuyển vùng dịch chuyển thành công -> Dừng gửi TPA liên tục
        if (msg.includes('dịch chuyển đến') || msg.includes('đã chấp nhận') || msg.includes('teleport')) {
            stopTpaLoop();
        }
    });

    bot.on('spawn', () => {
        console.log(chalk.yellow(`[${logName}]: Bot đã vào game thành công!`));
        
        // Tự động gõ /dn ngay khi spawn sảnh HUB
        bot.chat(`/dn ${acc.password}`);
        
        // Nếu bot hồi sinh (sau khi chết) ở cụm KingSMP
        if (bot.hasGoneToSMP) {
            console.log(chalk.red(`[${logName}]: 💀 Phát hiện bot vừa hồi sinh (Die)! Gửi lại TPA...`));
            startTpaLoop();
        } else {
            // Nếu là lúc mới vô game ở sảnh HUB, chạy vòng lặp mở menu
            startMenuLoop();
        }
    });

    // Sự kiện mở giao diện Menu thành công để click chọn cụm KingSMP
    bot.on('windowOpen', async (window) => {
        if (window.slots.length > 24 && !bot.hasGoneToSMP) {
            // Khi đã mở menu thành công thì xóa bỏ vòng lặp gõ menu ở sảnh HUB liền
            if (menuInterval) clearInterval(menuInterval);
            bot.hasGoneToSMP = true; // Đánh dấu đã qua sảnh
            
            console.log(chalk.white(`[${logName}]: 💻 Đã mở giao diện "MENU" thành công!`));
            console.log(chalk.white(`[${logName}]: 👉 Đang click vào KingSMP ở ô [24]...`));
            
            await bot.clickWindow(24, 0, 0);
            
            // Đợi 4 giây sau khi click để bot load hẳn qua map KingSMP rồi chạy vòng lặp TPA
            setTimeout(() => {
                startTpaLoop();
            }, 4000);

            // Vòng lặp chống AFK nhảy nhẹ
            setInterval(() => {
                if (bot.entity && bot.hasGoneToSMP) {
                    bot.setControlState('jump', true);
                    setTimeout(() => bot.setControlState('jump', false), 500);
                }
            }, 35000);
        }
    });

    // --- CHỨC NĂNG 4: TỰ ĐỘNG XỬ LÝ KHI BOT CHẾT (DIE) ---
    bot.on('death', () => {
        stopTpaLoop(); // Dừng lệnh cũ để chờ hồi sinh gõ lại lệnh mới
        console.log(chalk.bgRed.white(`[${logName}]: [CẢNH BÁO] Bot đã bị hạ gục (Die). Đang đợi tự động hồi sinh...`));
    });

    bot.on('end', () => {
        if (menuInterval) clearInterval(menuInterval);
        if (tpaInterval) clearInterval(tpaInterval);
        console.log(chalk.red(`\n[${logName}]: Bot mất kết nối. Đang tự khởi động lại...`));
        setTimeout(() => process.exit(), 1000);
    });

    bot.on('error', (err) => console.log(chalk.red(`[LỖI]: ${err.message}`)));
}

showMenu();
                                     
