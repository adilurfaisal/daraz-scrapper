const puppeteer = require('puppeteer');
const fac = require('fast-average-color-node');
const { GetColorName } = require('hex-color-to-color-name');
const fs = require('fs');
const moment = require('moment');

const mysql = require('mysql');
                
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "daraz"
});


async function scrapeProduct(browser, data, num) {
    let pData = data[num];
    const page = await browser.newPage();
    await page.goto(`${pData.link}`);
    
    try{
        const ColorVariantSelectedList = await page.$$("div.pdp-block__main-information div.sku-prop-content span[class='sku-variable-img-wrap-selected']");
        const ColorVariantNotSelectedList = await page.$$("div.pdp-block__main-information div.sku-prop-content span[class='sku-variable-img-wrap']");
        const ColorVariantList = [...ColorVariantSelectedList, ...ColorVariantNotSelectedList];
        const SizeVariantList = await page.$$("div.pdp-block__main-information div.sku-prop-content span[class^='sku-variable-size']");
        const ImageList = await page.$$("div.pdp-block__main-information div.next-slick-list div.item-gallery__image-wrapper > img");

        const Brand = await page.$("div.pdp-product-brand  a");
        let BrandName = await (await Brand.getProperty('textContent')).jsonValue();

        const BreadcrumbList = await page.$$("ul.breadcrumb > li");
        const BreadcrumbListList = await BreadcrumbList.map(async (v) => await (await v.getProperty('textContent')).jsonValue() );
        
        let BreadcrumbListData = await Promise.all(BreadcrumbListList.map(async (item) => {
            let ddddd = await item;
            return ddddd.replaceAll('\n', ' ').trim();
        }));

        let color_variant_list = await ColorVariantList.map(async (vs)=>{
            const VariantImgHas = await vs.$("img");
            let ImgUrl = await (await VariantImgHas.getProperty('src')).jsonValue()
            let dataawait = await fac.getAverageColor(ImgUrl);
            VariantValue = GetColorName(dataawait.hex)
            return { img: ImgUrl.trim(), title: VariantValue}
        })

        let rateSum = await ColorVariantList.reduce(async (SumColor, CurColor) => {
            let SumRes = await SumColor;
            if(SumRes==0 || SumRes==null || SumRes==undefined){
                SumRes = [];
            }
            let color = await CurColor;
            await SizeVariantList.map(async (sizeawait)=>{
                let size = await sizeawait;
                SumRes.push({color: color, size: size})
            });
            return SumRes;
        }, 0);

    
        let ProUpdateQuery = {
            vendor: BrandName,
            tags: BreadcrumbListData.slice(0, -1).join(",").replace(/\s+/g,' ').trim(),
            product_category: BreadcrumbListData.slice(0, -1).join(">").replace(/\s+/g,' ').trim(),
            product_type: BreadcrumbListData.slice(0, -1).slice(-1)[0].replace(/\s+/g,' '),
            update_time: moment().format('YYYY-MM-DD HH:mm:ss')
        }
        con.query("UPDATE product_list_ini SET `vendor`=?, `tags`=?, `product_type`=?, `product_category`=?, `update_time`=? WHERE id=?",
        [ProUpdateQuery.vendor, ProUpdateQuery.tags, ProUpdateQuery.product_type, ProUpdateQuery.product_category, ProUpdateQuery.update_time, pData.id],(err, result)=>{
            if (err) return console.log(err);
            console.log(ProUpdateQuery, result);
        });
    }catch(err) {
        console.log(err)
    }

    try{
        const ImgGallary = await page.$$("div.item-gallery .next-slick-list .item-gallery__thumbnail img");

        ImgGallary.forEach(async (ImgAwait)=>{
            let img = await ImgAwait;
            let imgUrl = await (await img.getProperty('src')).jsonValue();
            con.query("INSERT INTO product_img_ini SET `prod_id`=?, `img_src`=? ON DUPLICATE KEY UPDATE `prod_id`=?, `img_src`=?, `update_time`=?",
            [pData.id, imgUrl, pData.id, imgUrl, moment().format('YYYY-MM-DD HH:mm:ss')],(err, result)=>{
                if (err) return console.log(err);
                console.log(imgUrl, result);
            });
        })
    }catch(err) {
        console.log(err)
    }

    
    try{
        await rateSum.forEach(async (el, ei)=>{
            let Elem = await el;
            const color_cls = await page.evaluate(el => el.getAttribute('class'), Elem.color);
            const size_cls = await page.evaluate(el => el.getAttribute('class'), Elem.size);
            let color = await Elem.color;
            let size = await Elem.size;
            await setTimeout(async () => {
                try{
                    if(color_cls=="sku-variable-img-wrap"){
                        await Elem.color.click();
                    }
                    if(size_cls=="sku-variable-size"){
                        await Elem.size.click();
                    }
                    let PriceEle = await page.$("div.pdp-product-price > span");
                    let PriceEleTextCon = await (await PriceEle.getProperty('textContent')).jsonValue();
                    let PriceEleAmount = parseInt(PriceEleTextCon.replace(',', '').match(/\d+/g)[0] || 0);

                    const colorImg = await color.$("img");
                    let colorImgUrl = await (await colorImg.getProperty('src')).jsonValue();
                    let OrginalImgUrl = colorImgUrl.replaceAll("_34x34.jpg_.webp", "");
                    let colorCode = await fac.getAverageColor(colorImgUrl);
                    colorCode = GetColorName(colorCode.hex);
                    let sizeText = await (await size.getProperty('textContent')).jsonValue();

                
                    let sku = `${pData.handle}-${colorCode.replace(/\s+/g,' ').replaceAll(' ', '-').toLowerCase()}-${sizeText.replace(/\s+/g,'-')}`;
                    let qty = Math.floor(Math.random() * (50 - 0 + 1)) + 0;
                    let create_time = moment().format('YYYY-MM-DD HH:mm:ss');

                    con.query("INSERT INTO product_variant_ini SET `prod_id`=?, `option_1_name`=?, `option_1_value`=?, `option_2_name`=?, `option_2_value`=?, `option_3_name`=?, `option_3_value`=?, `option_4_name`=?, `option_4_value`=?, `variant_img`=?, `variant_img_sm`=?, `sku`=?, `qty`=?, `price`=?, `create_time`=? ON DUPLICATE KEY UPDATE `prod_id`=?, `option_1_name`=?, `option_1_value`=?, `option_2_name`=?, `option_2_value`=?, `option_3_name`=?, `option_3_value`=?, `option_4_name`=?, `option_4_value`=?, `variant_img`=?, `variant_img_sm`=?, `sku`=?, `qty`=?, `price`=?, `update_time`=?",
                    [pData.id, 'color', colorCode, 'size', sizeText, null, null, null, null, OrginalImgUrl, colorImgUrl, sku, qty, PriceEleAmount, create_time, pData.id, 'color', colorCode, 'size', sizeText, null, null, null, null, OrginalImgUrl, colorImgUrl, sku, qty, PriceEleAmount, create_time],(err, result)=>{
                        if (err) return console.log(err);
                        let affectedRows = result.affectedRows
                        console.log({colorCode, sizeText, PriceEleAmount, affectedRows});
                    });
                    
                }catch(err) {
                    console.log(err)
                }

            }, 500*ei);
        })

        await setTimeout(async () => {
            try{
                await page.close();
            }catch(err) {
                console.log(err)
            }
        }, 1000*15);

    }catch(err) {
        console.log(err)
    }finally{
        await setTimeout(async () => {
            await scrapeProduct(browser, data, num+1);
        }, 1000*2);
    }

    /*
    await ColorVariantList.forEach(async (colorawait, ci)=>{
        let color = await colorawait;
        await SizeVariantList.map(async (sizeawait, si)=>{
            let size = await sizeawait;
            await setTimeout(async ()=>{
                const classAttr = await page.evaluate(el => el.getAttribute('class'), color);
                if(classAttr=="sku-variable-img-wrap"){
                    await color.click() 
                }
            }, 1000*(ci+si))
        })
        
        await setTimeout(async ()=>{
            const classAttr = await page.evaluate(el => el.getAttribute('class'), color);
            if(classAttr=="sku-variable-img-wrap"){
                await color.click() 
            }
        }, 1000*ci)
    })
    */

    /*
    try{
        let ProUpdateQuery = {
            vendor: BrandName,
            tags: BreadcrumbListData.slice(0, -1).join(",").replace(/\s+/g,' ').trim(),
            product_category: BreadcrumbListData.slice(0, -1).join(">").replace(/\s+/g,' ').trim(),
            product_type: BreadcrumbListData.slice(0, -1).slice(-1)[0].replace(/\s+/g,' '),
            update_time: moment().format('YYYY-MM-DD HH:mm:ss')
        }
        con.query("UPDATE product_list_ini SET `vendor`=?, `tags`=?, `product_type`=?, `product_category`=?, `update_time`=? WHERE id=?",
        [ProUpdateQuery.vendor, ProUpdateQuery.tags, ProUpdateQuery.product_type, ProUpdateQuery.product_category, ProUpdateQuery.update_time, pData.id],(err, result)=>{
            if (err) return console.log(err);
            console.log(result);
        });
    }catch(err) {
        console.log(err)
    }
    

    try{
        color_variant_list.forEach(async (colorawait)=>{
            let color = await colorawait;
            con.query("INSERT INTO product_img_ini SET `prod_id`=?, `img_src`=? ON DUPLICATE KEY UPDATE `prod_id`=?, `img_src`=?, `update_time`=?",
            [pData.id, color.img, pData.id, color.img, moment().format('YYYY-MM-DD HH:mm:ss')],(err, result)=>{
                if (err) return console.log(err);
                console.log(result);
            });
        })
    }catch(err) {
        console.log(err)
    }


    color_variant_list.forEach(async (colorawait)=>{
        size_variant_list.forEach(async (sizeawait)=>{
            let color = await colorawait;
            let size = await sizeawait;
            let sku = `${pData.handle}-${color.title}-${size.title}`;
            let qty = Math.floor(Math.random() * (50 - 0 + 1)) + 0;
            //prod_id	option_1_name	option_1_value	option_2_name	option_2_value	option_3_name	option_3_value	option_4_name	option_4_value	sku	qty	price	create_time	update_time
            con.query("INSERT INTO product_img_ini SET `prod_id`=?, `option_1_name`=?, `option_1_value`=?, `option_2_name`=?, `option_2_value`=?, `option_3_name`=?, `option_3_value`=?, `option_4_name`=?, `option_4_value`=?, `sku`=?, `qty`=?, `price`=?, `create_time`=?",
            [pData.id, 'color', color.title, 'size', size.title, null, null, null, null, sku, qty],(err, result)=>{
                if (err) return console.log(err);
                console.log(result);
            });

        })
    })
    */
}

setTimeout(async ()=>{
    await con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
    });
    const browser = await puppeteer.launch({
        executablePath: "./chrome-win/chrome.exe",
        //executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        headless:false
    });

    try{
        con.query("SELECT id, title, handle, link FROM `product_list_ini` ORDER BY update_time ASC, RAND()", async(err, result)=>{
            if (err) return console.log(err);
            await scrapeProduct(browser, result, 0)
        });

    }catch(err) {
        console.log(err)
    }



})