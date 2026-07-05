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
    // Đã cập nhật chính xác tác giả là bạn: @user_phong75
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
        console.log(chalk.white(`[${data.selectedIndex + 1}]: `) + chalk.green(currentAcc.
        
