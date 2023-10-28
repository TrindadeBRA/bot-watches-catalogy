    const puppeteer = require('puppeteer');
    const fs = require('fs');

    (async () => {
        console.time('Tempo de execução'); // Inicia o temporizador

        const browser = await puppeteer.launch({
            headless: "new"
        });
        const page = await browser.newPage();
        let currentPage = 0;
        let hasNextPage = true;
        const products = [];

        while (hasNextPage) {
            await page.goto(`https://orient-watch.com/Collections/ORIENT-STAR/c/o3?q=%3Aname-asc&page=${currentPage}&text=`);

            console.log("Iniciando página ", currentPage+1)

            const productItems = await page.$$('.product-item');

            if (productItems.length === 0) {
                hasNextPage = false;
            } else {
                for (let i = 0; i < productItems.length; i++) {

                    console.time('Tempo de execução do produto');// Inicia o temporizador do produto

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

                    const descriptionText = await pageInternal.$eval('.description > p', description => description ? description.textContent.trim() : null);
                    console.log("Description: ", descriptionText);

                    const attributes = await pageInternal.$eval('.product-attributes ul', ul => {
                        const attributeElements = Array.from(ul.querySelectorAll('li'));
                        if (attributeElements.length === 0) {
                            return null; // Se não encontrar elementos, atribui null
                        }
                        const attributesArray = attributeElements.map(li => li.textContent.trim());
                        return attributesArray;
                    });
                    console.log("Attributes: ", attributes);

                    
                    const imagesGalley = await pageInternal.$$eval('.slider-nav .slick-slide img', imgs => {
                        if (imgs.length === 0) {
                            return null; // Se não encontrar elementos, atribui null
                        }
                        return imgs.map(img => img.getAttribute('src'));
                    });
                    console.log("Images: ", imagesGalley);
                    
                    await pageInternal.close();
                    
                    console.timeEnd('Tempo de execução do produto');// Finaliza o temporizador do produto

                    console.log("----");
                    console.log("----");
                    console.log("----");

                    products.push({
                        model: extractModelFromTitle(title),
                        imageUrl: imageUrl,
                        detailsUrl: internalUrl,
                        descriptionText: descriptionText,
                        manualUrl: manualUrl,
                        attributes: attributes,
                        imagesGalley: imagesGalley,
                    });


                }

                currentPage++;
            }
        }

        await browser.close();
        console.timeEnd('Tempo de execução');// Finaliza o temporizador geral

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
