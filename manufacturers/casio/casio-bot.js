const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.time('Tempo de execução');// Inicia o temporizador geral

    const browser = await puppeteer.launch({
        headless: "new"
    });

    const page = await browser.newPage();

    const products = [];

    await page.goto(`https://www.casio.com/us/watches.filter.K84vKnGqtM1LLU8tLgEA/`);
    let count = 1;

    let lastHeight = await page.evaluate('document.body.scrollHeight');

    while (true) {

        try {

            if (count % 40 === 0) {
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
                let newHeight = await page.evaluate('document.body.scrollHeight');
                // if (newHeight === lastHeight) {
                //     console.log("BREAKOU AQUI!!")
                //     break;
                // }
                lastHeight = newHeight;
            }


            await page.waitForSelector(`.cmp-product_panel_list__item:nth-child(${count})`, { timeout: 3000 });
            
            const liSelector = `.cmp-product_panel_list__item:nth-child(${count})`;

            const productCodeSelector = `${liSelector} .cmp-product_panel__code`;
            const productCode = await page.$eval(productCodeSelector, code => code.textContent.trim());
            
            const productCollectionSelector = `${liSelector} .cmp-product_panel__title`;
            const productCollection = await page.$eval(productCollectionSelector, collection => collection.textContent.trim());

            console.log(`#${count}-${productCollection}-${productCode}`);

            products.push({
                watch_model: productCode,
                watch_brand: "Casio",
                watch_collection: productCollection,
                watch_position: count,
            });

            count++;

        } catch (error) {
            console.log("Fim do script.");
            break
        }

    }

    console.timeEnd('Tempo de execução');// Inicia o temporizador geral

    await browser.close();

    fs.writeFileSync('results/casio-output.json', JSON.stringify(products, null, 2));
    console.log('Informações salvas em results/casio-output.json');
})();