const puppeteer = require("puppeteer");

const balance = async function(login){
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	const navigationPromise = page.waitForNavigation();

	await page.goto(
		"https://ib.sevenbank.co.jp/IB/IB_U_CO_002/IB_U_CO_002_100.aspx?Lang=ja-JP"
	);

	await page.setViewport({ width: 1712, height: 959 });

	await page.click("tbody #cphBizConf_txtLogonId");

	await page.type("tbody #cphBizConf_txtLogonId", login.id);

	await page.click("tbody #cphBizConf_txtLogonPw");
	await page.type("tbody #cphBizConf_txtLogonPw", login.password);

	await page.click("input[value='ログオン']");

	await page.waitForNavigation({timeout: 60000, waitUntil: "domcontentloaded"});
	//await page.screenshot({path: "screenshot/login.png"});

	const deposit = await page.evaluate(() => document.querySelector('#cphBizConf_lblDepositSum').innerText.replace(",", ""));

	await navigationPromise;
	await browser.close();

	return parseInt(deposit, 10);
}

module.exports.balance = balance;
