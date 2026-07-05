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
    console.log(chalk.blue.bold('Created by: ') + chalk.bgCyan.black(' @user_phong75 ') + chalk.blue.bold(' - Tool treo AFK ở Base [Bản Sạch]'));
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
    console.log(chalk.magenta('- Nhập ') + chalk.green("'Del <số_thứ_tự>'") + chalk.magenta(' để xóa tài khoản khỏi danh sách'));
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
        else if (cmd === 'del') {
            const idx = parseInt(parts[1]) - 1;
            if (isNaN(idx) || idx < 0 || idx >= data.accounts.length) { 
                console.log(chalk.red('\nSố thứ tự bot không hợp lệ!')); 
                setTimeout(showMenu, 1500); 
            } else {
                data.accounts.splice(idx, 1); // Xóa bot khỏi danh sách
                // Cập nhật lại vị trí bot đang chọn
                if (data.accounts.length === 0) data.selectedIndex = -1;
                else if (data.selectedIndex >= data.accounts.length) data.selectedIndex = data.accounts.length - 1;
                saveConfig(); 
                console.log(chalk.green('\nĐã xóa bot thành công!'));
                setTimeout(showMenu, 1000);
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
        
