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

            if (count % 30 === 0) {
                // break
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

            const productCoverSelector = `${liSelector} .cmp-product_panel__img.primary-image img`;
            const productCover = await page.$eval(productCoverSelector, image => image.src);

            const productInternalUrlSelector = `${liSelector} .cmp-product_panel__inner a`;
            const internalUrl = await page.$eval(productInternalUrlSelector, a => a.href);

            const pageInternal = await browser.newPage();
            console.time('Tempo de execução do produto');
            await pageInternal.goto(internalUrl);
            await pageInternal.waitForSelector('#mainContent');


            let manualUrl;
            try {
                manualUrl = await pageInternal.$eval('.p-product_detail-spec-related a', a => a ? a.href : null);
            } catch (error) {
                manualUrl = null;
            }
            console.log("Manual: ", manualUrl);


            let descriptionText;
            try {
                descriptionText = await pageInternal.$eval('.p-product_detail-feature-txt p', description => {
                    // Obtém o conteúdo do elemento e remove espaços extras
                    return description.innerHTML.replace(/\s+/g, ' ').trim();
                });
            } catch (error) {
                descriptionText = null;
            }
            // console.log("Description: ", descriptionText);


            let imagesGallery = [];
            try {
                imagesGallery = await pageInternal.$$eval('.p-product_detail-visual__inner .p-product_detail-visual__itm-img img', imgElements => {
                    // Obtém as URLs das imagens e remove espaços extras
                    return imgElements.map(imgElement => {
                        let imageUrl = imgElement.getAttribute('src').replace(/\s+/g, ' ').trim();
                        // Adiciona o domínio às URLs das imagens
                        return `https://www.casio.com${imageUrl}`;
                    });
            
                });
            } catch (error) {
                console.error('Erro ao buscar URLs das imagens:', error);
            }
            console.log("Images: ", imagesGallery.length);                    


            console.timeEnd('Tempo de execução do produto');// Finaliza o temporizador do produto
            await pageInternal.close();

            console.log(`#${count}-${productCollection}-${productCode}`);
            console.log("Imagem: ", productCover)
            console.log("URL Interna: ", internalUrl)
            console.log("---")
            console.log("---")
            console.log("---")

            products.push({
                watch_position: count,
                watch_model: productCode,
                watch_brand: "Casio",
                watch_collection: productCollection,
                watch_cover: productCover,
                watch_details_url: internalUrl,
                watch_images: imagesGallery,
                watch_manual_url: manualUrl,
                watch_description: descriptionText,
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