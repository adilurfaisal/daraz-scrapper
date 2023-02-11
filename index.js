const puppeteer = require('puppeteer');
const fac = require('fast-average-color-node');
const { GetColorName } = require('hex-color-to-color-name');
var fs = require('fs');


async function scrapeProduct(url) {
    const browser = await puppeteer.launch({
        executablePath: "./chrome-win/chrome.exe",
        //executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        headless:false
    });
  const page = await browser.newPage();
  await page.goto(url);


  const productContainer = await page.$("div[data-qa-locator='general-products']")
  const productList = await productContainer.$$("div[data-qa-locator='product-item']")

  let productData = await productList.map(async (v)=>{
    const productInfo = await v.$("div.info--ifj7U")
    const productLink = await v.$("div.title--wFj93 > a")
    const productTitle = await v.$("div.title--wFj93 > a")
    const productPrice = await v.$("div.price--NVB62 > span")
    const productRate = await v.$$("div.rating--ZI3Ol > span > i")
    const productRateCount = await v.$("div.rating--ZI3Ol > span.rating__review--ygkUy")
    const productThumbnail = await v.$("img.image--WOyuZ");

    let rateSum = await productRate.reduce(async (Sum, Cur) => {
        const classAttr = await page.evaluate(el => el.getAttribute('class'), Cur);
        let RateNumber = parseInt(classAttr.match(/\d+/g)[1]);
        let SumAwait = await Sum;
        return SumAwait + (RateNumber==10 ? 1.0 : parseFloat(`0.${RateNumber}`));
    }, 0);
    
    let productDetails = {
        link: await (await productLink.getProperty('href')).jsonValue(),
        title: await (await productTitle.getProperty('textContent')).jsonValue(),
        price: await (await productPrice.getProperty('textContent')).jsonValue(),
        rate: rateSum,
        rate_count: await (await productRateCount.getProperty('textContent')).jsonValue(),
        thumbnail: await (await productThumbnail.getProperty('src')).jsonValue(),
    }
    return productDetails;
  })

  
    let productQueryHeader = [
        "Handle",
        "Title",
        "Image Src",
        "Tags",
        "Vendor",
        "Type",
        "Option1 Name",
        "Option1 Value",
        "Option2 Name",
        "Option2 Value",
        "Variant Image",
        "Variant SKU",
        "Variant Inventory Quantity",
        "Variant Price"
    ]
    fs.writeFileSync('product-list.csv', Object.values(productQueryHeader).join(",") + '\r\n', (err) => {
        if (err) throw err;
        console.log('It\'s saved!');
    });


  await productDetails(browser, productData, 0);

  /*
  await productData.forEach(async (v)=>{
    let pData = await v;
    console.log(pData.link)
    const page = await browser.newPage();
    await page.goto(url);
    await page.goto(pData.link);

    const productColors = await page.$$("div.sku-prop-content span.sku-variable-img-wrap");

    productColors.forEach(async (v)=>{
        let data = await v;
        console.log(data)
    })


    console.log(data)
  })

  */

  //const text = await (await element.getProperty('textContent')).jsonValue()
    //console.log(text)
  /*
  const [el] = await page.$x('//h1[contains(@class, "title")]');
  const productName = await el.getProperty('textContent');
  const productNameValue = await productName.jsonValue();

  const [priceEl] = await page.$x('//span[contains(@class, "price")]');
  const productPrice = await priceEl.getProperty('textContent');
  const productPriceValue = await productPrice.jsonValue();

  console.log({ productNameValue, productPriceValue });

  browser.close();
  */
}

let productImg = async (ImageList) => {
    return ImageList.map(async (il)=>{
        let ImgSrc = await (await il.getProperty('src')).jsonValue()
        return ImgSrc;
    })
}

let productDetails = async (browser, list, index) => {
    let pData = await list[index]
    //console.log(pData)
    if(!pData){
        return null;
    }
    const page = await browser.newPage();
    await page.goto(pData.link);


    const ColorVariantList = await page.$$("div.pdp-block__main-information div.sku-prop-content span[class^='sku-variable-img-wrap']");
    const SizeVariantList = await page.$$("div.pdp-block__main-information div.sku-prop-content span[class^='sku-variable-size']");
    const ImageList = await page.$$("div.pdp-block__main-information div.next-slick-list div.item-gallery__image-wrapper > img");

    const ProductDetails = await page.$("div.pdp-product-desc");
    const ProductDetailsHTML = await (await ProductDetails.getProperty('innerHTML')).jsonValue();

    const BreadcrumbList = await page.$$("ul.breadcrumb > li");
    const BreadcrumbListList = await BreadcrumbList.map(async (v) => await (await v.getProperty('textContent')).jsonValue() );


    let images_list = await ImageList.map(async (il)=>{
        let ImgSrc = await (await il.getProperty('src')).jsonValue()
        return ImgSrc;
    })
    
    let color_variant_list = await ColorVariantList.map(async (vs)=>{
        const VariantImgHas = await vs.$("img");
        let ImgUrl = await (await VariantImgHas.getProperty('src')).jsonValue()
        let dataawait = await fac.getAverageColor(ImgUrl);
        VariantValue = GetColorName(dataawait.hex)
        return { img: ImgUrl.trim(), title: VariantValue}
    })
    
    let size_variant_list = await SizeVariantList.map(async (vs)=>{
        let VariantValue = await (await vs.getProperty('textContent')).jsonValue()
        return VariantValue
    })


    color_variant_list.forEach(async (colorawait)=>{
        size_variant_list.forEach(async (sizeawait)=>{
            let color = await colorawait;
            let size = await sizeawait;

            let BreadcrumbListData = await Promise.all(BreadcrumbListList.map(async (item) => {
                let ddddd = await item;
                return ddddd.replaceAll('\n', '').replaceAll(' ', '').trim();
            }));

            let productQuery = {
                "Handle": pData.title.replaceAll(' ', '-').replaceAll('--', '-').toLowerCase().trim(),
                "Title": pData.title.trim(),
                "Image Src": pData.thumbnail,
                //"Body (HTML)": ProductDetailsHTML,
                //"Product Category": BreadcrumbListData.slice(0, -1).join(" > ").trim(),
                "Tags": '"'+BreadcrumbListData.slice(0, -1).join(",").trim()+'"',
                "Vendor": "BU Tech Shop",
                "Type": "T-Shirt",
                "Option1 Name": "Color",
                "Option1 Value": `${color.title}`,
                "Option2 Name": "Size",
                "Option2 Value": `${size}`,
                "Variant Image": `${color.img.replaceAll("_34x34.jpg_.webp", "")}`,
                "Variant SKU": pData.title.replaceAll(' ', '-').trim(),
                "Variant Inventory Quantity": (Math.floor(Math.random() * (20 - 10 + 1)) + 10),
                "Variant Price": pData.price.match(/\d+/g)[0]
            }
            console.log(productQuery)


            fs.appendFile('product-list.csv', Object.values(productQuery).join(",") + '\r\n', (err) => {
                if (err) throw err;
                console.log('It\'s saved!');
            });
            console.log("==================================")
        })
    })

    setTimeout(()=>{
        page.close();
    }, 1000*2)
    
    /*
    images_list.forEach(async (v)=>{
        let dd = await v;
        console.log(dd)
    })
    variant_list.forEach(async (v)=>{
        let dd = await v;
        console.log(dd)
    })

    console.log(pData)

    console.log(productQuery)
    */

    console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

    


    return await productDetails(browser, list, index+1)

}

scrapeProduct('https://www.daraz.com.bd/mens-clothing/');