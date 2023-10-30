const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.time('Tempo de execução');// Inicia o temporizador geral

    const browser = await puppeteer.launch({
        headless: "new"
    });
    const page = await browser.newPage();
    let currentPage = 0;
    let hasNextPage = true;
    const products = [];

    while (hasNextPage) {
        await page.goto(`https://orient-watch.com/Collections/ORIENT/c/o2?q=%3Aname-asc&page=${currentPage}&text=`);

        console.log("Iniciando página ", currentPage + 1)

        const productItems = await page.$$('.product-item');

        if (productItems.length === 0) {
            hasNextPage = false;
        } else {
            for (let i = 0; i < productItems.length; i++) {

                console.time('Tempo de execução do produto');

                console.log(`Iniciando produto ${i + 1}/30`)

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

                let manualUrl;
                try {
                    manualUrl = await pageInternal.$eval('.product-attributes a', a => a ? a.href : null);
                } catch (error) {
                    manualUrl = null;
                }
                console.log("Manual: ", manualUrl);

                let attributes;
                try {
                    attributes = await pageInternal.$eval('.product-attributes ul', ul => {
                        const attributeElements = Array.from(ul.querySelectorAll('li'));
                        if (attributeElements.length === 0) {
                            return null;
                        }
                        const attributesArray = attributeElements.map(li => li.textContent.trim());
                        return attributesArray;
                    });
                } catch (error) {
                    attributes = null;
                }
                console.log("Attributes: ", attributes);

                let imagesGallery;
                try {
                    imagesGallery = await pageInternal.$$eval('.slider-nav .slick-slide img', imgs => {
                        if (imgs.length === 0) {
                            return null;
                        }
                        return imgs.map(img => img.getAttribute('src'));
                    });
                } catch (error) {
                    imagesGallery = null;
                }
                console.log("Images: ", imagesGallery);



                let descriptionText;
                try {
                    const descriptionElements = await pageInternal.$$eval('.description > p', pElements => {
                        return pElements.map(pElement => pElement.textContent.trim());
                    });

                    descriptionText = descriptionElements.join(' ');
                    descriptionText = descriptionText.replace(/\s+/g, ' ').trim();
                } catch (error) {
                    descriptionText = null;
                }

                console.log("Description: ", descriptionText);

                await pageInternal.close();

                console.timeEnd('Tempo de execução do produto');// Finaliza o temporizador do produto

                console.log("----");
                console.log("----");
                console.log("----");

                products.push({
                    watch_model: extractModelFromTitle(title),
                    watch_brand: "Orient",
                    watch_title: title,
                    watch_cover: imageUrl,
                    watch_images: imagesGallery,
                    watch_details_url: internalUrl,
                    watch_manual_url: manualUrl,
                    watch_description: descriptionText,
                    watch_attributes: attributes,
                });


            }

            currentPage++;
        }
    }

    await browser.close();
    console.timeEnd('Tempo de execução');

    const currentDateTime = new Date();
    const year = currentDateTime.getFullYear();
    const month = String(currentDateTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentDateTime.getDate()).padStart(2, '0');
    const hours = String(currentDateTime.getHours()).padStart(2, '0') + 'h';
    const minutes = String(currentDateTime.getMinutes()).padStart(2, '0') + 'm';
    const seconds = String(currentDateTime.getSeconds()).padStart(2, '0') + 's';
    const fileName = `results/orient/orient-output-${year}-${month}-${day}-${hours}-${minutes}-${seconds}.json`;

    fs.writeFileSync(fileName, JSON.stringify(products, null, 2)); console.log('Informações salvas em results/orient-output.json');
})();

function extractModelFromTitle(title) {
    const regex = /\((.*?)\)/;
    const modelMatch = title.match(regex);
    if (modelMatch && modelMatch.length > 1) {
        return modelMatch[1];
    }
    return "";
}
