const Bucket = require("@spica-devkit/bucket");
const PRODUCT_BUCKET_ID = process.env.PRODUCT_BUCKET_ID;
const API_KEY = process.env.API_KEY;

export async function commentAdder(trigger_data) {
  let bucket_data = trigger_data.current;

  if (!bucket_data.product) {
    console.log(
      "ERROR: There is not any product data in the comment data. Data: ",
      bucket_data
    );
    return true;
  }

  Bucket.initialize({ apikey: API_KEY });

  let product_data = await Bucket.data.get(
    PRODUCT_BUCKET_ID,
    bucket_data.product
  );

  if (!product_data) {
    console.log(
      "ERROR: There is not any product with this product id while adding comment. Data: ",
      product_data
    );
    return true;
  }

  let patch_data = {
    rating_count: product_data.rating_count,
    rating_average: product_data.rating_average,
  };

  if (!patch_data.rating_count) {
    patch_data.rating_count = 0;
  }

  if (!patch_data.rating_average) {
    patch_data.rating_average = 0;
  }

  patch_data.rating_average = calculateAverageAdded(
    patch_data.rating_average,
    patch_data.rating_count,
    bucket_data.score
  );
  patch_data.rating_count = patch_data.rating_count + 1;

  await updateProduct(product_data._id, patch_data);

  return true;
}

export async function commentDeleter(trigger_data) {
  let bucket_data = trigger_data.previous;

  if (!bucket_data.product) {
    console.log(
      "ERROR: There is not any product data in the comment data. Data: ",
      bucket_data
    );
    return true;
  }

  Bucket.initialize({ apikey: API_KEY });

  let product_data = await Bucket.data.get(
    PRODUCT_BUCKET_ID,
    bucket_data.product
  );

  if (!product_data) {
    console.log(
      "ERROR: There is not any product with this product id while adding comment. Data: ",
      product_data
    );
    return true;
  }

  let patch_data = {
    rating_count: product_data.rating_count,
    rating_average: product_data.rating_average,
  };

  if (
    !patch_data.rating_count ||
    !patch_data.rating_average ||
    patch_data.rating_count <= 0 ||
    patch_data.rating_average <= 0
  ) {
    patch_data.rating_count = 0;
    patch_data.rating_average = 0;
  } else {
    patch_data.rating_average = calculateAverageDeleted(
      patch_data.rating_average,
      patch_data.rating_count,
      bucket_data.score
    );
    patch_data.rating_count = patch_data.rating_count - 1;
    patch_data.rating_average = patch_data.rating_average
      ? patch_data.rating_average
      : 0;
  }

  await updateProduct(product_data._id, patch_data);

  console.log("delete data: ", trigger_data);
  return true;
}

async function updateProduct(id, patch_data) {
  await Bucket.data
    .patch(PRODUCT_BUCKET_ID, id, patch_data)
    .then((data) => {
      console.log("product updated successfully", data);
    })
    .catch((error) => {
      console.log("error: ", error);
    });
}

// run on adding comment
function calculateAverageAdded(oldAverage, oldCount, newScore) {
  return (oldAverage * oldCount + newScore) / (oldCount + 1);
}

// run on deleting comment
function calculateAverageDeleted(oldAverage, oldCount, deleted_score) {
  return (oldAverage * oldCount - deleted_score) / (oldCount - 1);
}
