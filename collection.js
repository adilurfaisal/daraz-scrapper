const puppeteer = require('puppeteer');
const fac = require('fast-average-color-node');
const { GetColorName } = require('hex-color-to-color-name');
var fs = require('fs');

var mysql = require('mysql');
                
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "daraz"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

async function scrapeProduct(browser, url, pagenum) {
  const page = await browser.newPage();
  await page.goto(`${url}?page=${pagenum}`);


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
    
    try{
        let productDetails = {
            Page: pagenum,
            Link: await (await productLink.getProperty('href')).jsonValue(),
            Title: await (await productTitle.getProperty('textContent')).jsonValue(),
            Price: await (await productPrice.getProperty('textContent')).jsonValue(),
            Rate: rateSum,
            Rate_Count: await (await productRateCount.getProperty('textContent')).jsonValue(),
            Thumbnail: await (await productThumbnail.getProperty('src')).jsonValue(),
        }
        return productDetails;
    }catch(err) {
        return {};
    }
  })

  
  /*
    let productQueryHeader = [
        "Link",
        "Title",
        "Price",
        "Rate",
        "Rate_Count",
        "Thumbnail Name"
    ]
    fs.writeFileSync('collection.csv', Object.values(productQueryHeader).join(",") + '\r\n', (err) => {
        if (err) throw err;
        console.log('It\'s saved!');
    });
    */

    await productData.forEach(async (d)=>{
        let pData = await d;
        try{
            pData.Title = pData.Title.replace(/\s+/g,' ').trim();
            pData.Handle = pData.Title.replace(/[^a-zA-Z ]/g, "").replace(/\s+/g,' ').trim().replaceAll(' ', '-').replaceAll('--', '-').toLowerCase();
            pData.Link = pData.Link.split('?')[0] || pData.Link;
            pData.Price = pData.Price.match(/\d+/g)[0] || 0;
            pData.Rate_Count = pData.Rate_Count.match(/\d+/g)[0];
            fs.appendFile('collection.csv', Object.values(pData).join(",") + '\r\n', (err) => {
                if (err) throw err;
                console.log(pData);
            });

            
            try{

                con.query("INSERT INTO product_list_ini SET `handle`=?, `title`=?, `link`=?, `thumbnail`=?, `price`=?, `rate`=?, `total_rate`=?, `page_num`=? ON DUPLICATE KEY UPDATE `handle`=?, `title`=?, `link`=?, `thumbnail`=?, `price`=?, `rate`=?, `total_rate`=?, `page_num`=?",
                [pData.Handle, pData.Title, pData.Link, pData.Thumbnail, pData.Price, pData.Rate, pData.Rate_Count, pData.Page, pData.Handle, pData.Title, pData.Link, pData.Thumbnail, pData.Price, pData.Rate, pData.Rate_Count, pData.Page],(err, result)=>{
                    if (err) return console.log(err);
                    pData.affectedRows = result.affectedRows;
                    console.log(pData);
                });

            }catch(err) {
                console.log(err)
            }
              
        }catch(err) {
            console.log(err)
        }
    })

    /*
    fs.appendFile('collection.csv', Object.values(productQuery).join(",") + '\r\n', (err) => {
        if (err) throw err;
        console.log('It\'s saved!');
    });
    */
    scrapeProduct(browser, 'https://www.daraz.com.bd/mens-clothing/', pagenum+1);

    setTimeout(()=>{
        page.close();
    }, 1000*2)



}


setTimeout(async ()=>{
    const browser = await puppeteer.launch({
        executablePath: "./chrome-win/chrome.exe",
        //executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        headless:false
    });
    await scrapeProduct(browser, 'https://www.daraz.com.bd/mens-clothing/', 1);
})