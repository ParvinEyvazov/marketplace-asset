const Bucket = require("@spica-devkit/bucket");

const PRODUCT_BUCKET_ID = process.env.PRODUCT_BUCKET_ID;
const API_KEY = process.env.API_KEY;

export async function saleCounter(trigger_data) {
    console.log("trigger_data", trigger_data);

    let previos_data = trigger_data.previous;
    let current_data = trigger_data.current;

    if (!previos_data.status || !current_data.status) {
        return true;
    }

    if (previos_data.status != "pending" || current_data.status != "accepted") {
        return true;
    }

    Bucket.initialize({ apikey: API_KEY });

    current_data["products"].forEach(async product_id => {
        let product_data = await Bucket.data
            .get(PRODUCT_BUCKET_ID, product_id)
            .catch(error => console.log("error: ", error));

        if (!product_data) {
            console.log(
                "ERROR: There is not any product with this product id while adding comment. Data: ",
                product_data
            );
            return true;
        }

        if (!product_data.sales) {
            product_data.sales = 0;
        }

        let patch_data = {
            sales: product_data.sales + 1
        };

        await updateProduct(product_data._id, patch_data);
    });
}

async function updateProduct(id, patch_data) {
    await Bucket.data
        .patch(PRODUCT_BUCKET_ID, id, patch_data)
        .then(data => {
            console.log("product updated successfully", data);
        })
        .catch(error => {
            console.log("error: ", error);
        });
}
