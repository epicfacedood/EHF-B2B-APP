import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

async function updateProductImages() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(process.env.DB_NAME);
    const products = db.collection("products");

    // Get all products
    const allProducts = await products.find({}).toArray();
    console.log(`Found ${allProducts.length} products`);

    // Get list of image files
    const imagesDir = "../../frontend/public/productImages";
    const imageFiles = fs.readdirSync(path.resolve(__dirname, imagesDir));
    console.log(`Found ${imageFiles.length} images`);

    // Update each product
    let updatedCount = 0;
    for (const product of allProducts) {
      const imageFile = imageFiles.find((file) =>
        file.toLowerCase().includes(product.pcode.toLowerCase())
      );

      if (imageFile) {
        const imageUrl = `/productImages/${imageFile}`;
        await products.updateOne(
          { _id: product._id },
          { $set: { image: [imageUrl] } }
        );
        updatedCount++;
        console.log(`Updated image for product ${product.pcode}`);
      }
    }

    console.log(`\nUpdate complete:`);
    console.log(`Total products: ${allProducts.length}`);
    console.log(`Products updated: ${updatedCount}`);
    console.log(
      `Products without images: ${allProducts.length - updatedCount}`
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

updateProductImages();
