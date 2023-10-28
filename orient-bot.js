    const puppeteer = require('puppeteer');
    const fs = require('fs');

    (async () => {
        console.time('Tempo de execução'); // Inicia o temporizador

        const browser = await puppeteer.launch({
            headless: "new"
        });
        const page = await browser.newPage();
        let currentPage = 1;
        let hasNextPage = true;
        const products = [];

        while (hasNextPage) {
            await page.goto(`https://orient-watch.com/Collections/ORIENT/c/o2?q=%3Aname-asc&page=${currentPage}&text=`);

            console.log("Iniciando página ", currentPage)

            const productItems = await page.$$('.product-item');

            if (productItems.length === 0) {
                hasNextPage = false;
            } else {
                for (let i = 0; i < productItems.length; i++) {

                    console.log(`Iniciando produto ${i+1}/30`)

                    const productItem = productItems[i];

                    const imageUrl = await productItem.$eval('.thumb img', img => img.src);
                    console.log('Imagem: ', imageUrl);

                    const title = await productItem.$eval('.name', name => name.textContent);
                    console.log('Title: ', extractModelFromTitle(title));
                    
                    const internalUrl = await productItem.$eval('.name', name => name.href);
                    const pageInternal = await browser.newPage();
                    
                    console.log('InternalUrl: ', internalUrl);
                    await pageInternal.goto(internalUrl);
                    await pageInternal.waitForSelector('.product-info');
                    
                    const manualUrl = await pageInternal.$eval('.product-attributes a', a => a ? a.href : null);
                    console.log("Manual: ", manualUrl);
                    
                    await pageInternal.close();
                    
                    console.log("----");
                    console.log("----");
                    console.log("----");

                    products.push({
                        model: extractModelFromTitle(title),
                        imageUrl: imageUrl,
                        detailsUrl: internalUrl,
                        manualUrl: manualUrl,
                    });
                }

                currentPage++;
            }
        }

        await browser.close();
        console.timeEnd('Tempo de execução');

        const tempoDeExecucao = console.timeEnd('Tempo de execução');
        products.push({ tempoDeExecucao });

        fs.writeFileSync('results/orient-output.json', JSON.stringify(products, null, 2));
        console.log('Informações salvas em output.json');
    })();

    function extractModelFromTitle(title) {
        const regex = /\((.*?)\)/;
        const modelMatch = title.match(regex);
        if (modelMatch && modelMatch.length > 1) {
            return modelMatch[1];
        }
        return "";
    }
