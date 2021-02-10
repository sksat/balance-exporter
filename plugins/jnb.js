const puppeteer = require('puppeteer');

const balance = async function(login) {
	const browser = await puppeteer.launch({headless: true});
	const page_first = await browser.newPage();

	const navigationPromise = page_first.waitForNavigation();

	await page_first.goto('https://www.japannetbank.co.jp/');

	await page_first.setViewport({ width: 1957, height: 678 });

	const [page] = await Promise.all([
		browser.waitForTarget(t => t.opener() === page_first.target()).then(t => t.page()),
		await page_first.waitForSelector('#main-box > .bg-entrance > .account-group > .account-group__btn > .login_btn'),
		await page_first.click('#main-box > .bg-entrance > .account-group > .account-group__btn > .login_btn')
	]);

	await page.waitForSelector('#mainArea #idTenNo')
	await page.click('#mainArea #idTenNo')
	await page.type('#mainArea #idTenNo', login.id_ten);

	await page.waitForSelector('#mainArea #idKozaNo');
	await page.click('#mainArea #idKozaNo');
	await page.type('#mainArea #idKozaNo', login.id_koza);

	await page.waitForSelector('#mainArea #idPw');
	await page.click('#mainArea #idPw');
	await page.type('#mainArea #idPw', login.password);

	await page.waitForSelector('#inContainer > #mainArea > .loginForm > .blk > .loginBtn');
	await page.click('#inContainer > #mainArea > .loginForm > .blk > .loginBtn');

	await page.waitForSelector('#mainArea > .loginForm > .blk > .loginBtn > .btn');
	await page.click('#mainArea > .loginForm > .blk > .loginBtn > .btn');

	//await page.screenshot({path: "login.png"});

	await page.waitForNavigation({timeout: 60000, waitUntil: "domcontentloaded"});
	//await page.screenshot({path: "welcome.png"});

	await page.waitForSelector('body #container');
	await page.click('body #container');

	//const balance = await page.waitForSelector('.infoL > table > tbody > tr > .yenBalance').innerText;
	const b = await page.evaluate(() => document.querySelector('.yenBalance').innerText.replace(",", "").replace(" 円", ""));
	//console.log(b);

	page.on('dialog', async dialog => {
		//console.log("dialog");
		//console.log("  type: " + await dialog.type());
		const msg = await dialog.message();
		//console.log("  msg:  " + msg);

		if (msg == "ログアウトしますか？"){
			//console.log("logout...");
			await dialog.accept();
		}
	});

	//await page.waitForSelector('body #container')
	//await page.click('body #container')

	await page.waitForSelector('#bodyWrapper > #hdrContainer > .hdrLR > .hdrR > .logout')
	await page.click('#bodyWrapper > #hdrContainer > .hdrLR > .hdrR > .logout')

	await page.waitForNavigation({timeout: 60000, waitUntil: "domcontentloaded"});
	//await page.screenshot({path: "logout.png"});

	await navigationPromise;
	await browser.close();

	return parseInt(b, 10);
}

module.exports.balance = balance;
