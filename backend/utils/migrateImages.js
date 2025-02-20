import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import productModel from "../models/productModel.js";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary with your existing env variable names
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// MongoDB connection with your existing env variable name
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      dbName: process.env.DB_NAME,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

const findProductImages = (pcode, imagesDirs) => {
  let allImages = [];

  // Check each directory for images
  for (const dir of imagesDirs) {
    try {
      const files = fs.readdirSync(dir);
      const pattern = new RegExp(`^${pcode}(_\\d+)?\\.jpg$`, "i");
      const foundImages = files
        .filter((file) => pattern.test(file))
        .map((file) => ({ path: path.join(dir, file), name: file }));
      allImages = [...allImages, ...foundImages];
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }
  }

  return allImages;
};

const migrateImagesToCloudinary = async () => {
  try {
    await connectDB();

    const products = await productModel.find({});
    console.log(`Processing ${products.length} products`);

    const imagesDirs = [
      path.join(process.cwd(), "..", "frontend", "public", "productImages"),
      path.join(process.cwd(), "..", "frontend", "public", "final_images"),
    ];

    const productsWithoutImages = [];
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      try {
        // Skip if product already has Cloudinary URLs
        if (product.image?.length > 0 && product.image[0].startsWith("http")) {
          console.log(
            `Skipping ${product.pcode} - already has Cloudinary URLs`
          );
          skippedCount++;
          continue;
        }

        const productImages = findProductImages(
          product.pcode.toUpperCase(),
          imagesDirs
        );

        if (productImages.length > 0) {
          console.log(
            `Found ${productImages.length} images for product: ${product.pcode}`
          );

          const cloudinaryUrls = [];

          for (const image of productImages) {
            console.log(`Uploading image: ${image.name} from ${image.path}`);

            const result = await cloudinary.uploader.upload(image.path, {
              folder: "products",
              public_id: image.name.replace(".jpg", ""),
              overwrite: true,
            });

            cloudinaryUrls.push(result.secure_url);
          }

          product.image = cloudinaryUrls;
          await product.save();
          successCount++;

          console.log(
            `Successfully migrated ${cloudinaryUrls.length} images for ${product.pcode}`
          );
        } else {
          console.log(`No images found for product: ${product.pcode}`);
          productsWithoutImages.push({
            pcode: product.pcode,
            name: product.itemName,
            category: product.category,
          });
          failureCount++;
        }
      } catch (error) {
        console.error(`Error processing ${product.pcode}:`, error);
        productsWithoutImages.push({
          pcode: product.pcode,
          name: product.itemName,
          category: product.category,
          error: error.message,
        });
        failureCount++;
      }
    }

    // Generate final report
    console.log("\n=== Migration Report ===");
    console.log(`Total products processed: ${products.length}`);
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Already on Cloudinary (skipped): ${skippedCount}`);
    console.log(`Failed/No images: ${failureCount}`);

    console.log("\n=== Products Without Images ===");
    console.table(productsWithoutImages);

    // Save report to file
    const reportPath = path.join(process.cwd(), "migration-report.json");
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          date: new Date().toISOString(),
          totalProducts: products.length,
          successCount,
          skippedCount,
          failureCount,
          productsWithoutImages,
        },
        null,
        2
      )
    );
    console.log(`\nDetailed report saved to: ${reportPath}`);
  } catch (error) {
    console.error("Migration failed:", error);
    console.error("Full error:", error.stack);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

migrateImagesToCloudinary();
