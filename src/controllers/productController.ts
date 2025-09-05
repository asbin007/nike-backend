import { Request, Response, NextFunction } from "express";
import Category from "../database/models/categoryModel.js";
import Shoe from "../database/models/productModel.js";
import Collection from "../database/models/collectionModel.js";
import { envConfig } from "../config/config.js";
import jwt from "jsonwebtoken";
import Cart from "../database/models/cartModel.js";
import ProductReview from "../database/models/productReviewModal.js";
import User from "../database/models/userModel.js";
import { Model } from "sequelize-typescript";

class ProductController {
  // Helper function to transform input to array of strings
  private static transformToArray(value: any): string[] {
    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item);
    }
    return Array.isArray(value) ? value.map(String).filter((item) => item) : [];
  }

  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        brand,
        price,
        originalPrice,
        categoryId,
        discount,
        sizes,
        colors,
        features,
        inStock,
        isNew,
        description,
        totalStock,
        collectionId,
        images: imagesUrls
      } = req.body;

      // Enhanced validation
      if (
        !name ||
        !brand ||
        !price ||
        !originalPrice ||
        !categoryId ||
        !collectionId ||
        !totalStock ||
        !description 
      ) {
        res.status(400).json({
          message: "Missing required fields: name, brand, price, originalPrice, categoryId, collectionId, totalStock, description",
        });
        return;
      }

      // Handle image field (support both uploaded files and URLs)
      let images: string[] = ProductController.transformToArray(imagesUrls);
      if (req.files && Array.isArray(req.files)) {
        images = [
          ...images,
          ...(req.files as Express.Multer.File[]).map(
            (file) => `/uploads/${file.filename}`
          ),
        ];
      }

      const product = await Shoe.create({
        name,
        brand,
        price: parseFloat(price) || 0,
        originalPrice: parseFloat(originalPrice) || 0,
        discount: parseFloat(discount) || 0,
        categoryId,
        images: images.length ? images : [],
        sizes: ProductController.transformToArray(sizes),
        colors: ProductController.transformToArray(colors),
        features: ProductController.transformToArray(features),
        inStock: inStock === "true" || inStock === true,
        isNew: isNew === "true" || isNew === true,
        description: description || "No description",
        collectionId,
        totalStock: parseInt(totalStock) || 0,
      });

      res.status(201).json({
        message: "Product created successfully",
        data: product,
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const products = await Shoe.findAll({
        include: [
          {
            model: Category,
            attributes: ["id", "categoryName"],
          },
          {
            model: Collection,
            attributes: ["id", "collectionName"],
          },
        ],
      });

      res.status(200).json({
        message: "Products fetched successfully",
        data: products,
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getSingleProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const product = await Shoe.findOne({
        where: { id },
        include: [
          {
            model: Category,
            attributes: ["id", "categoryName"],
          },
          {
            model: Collection,
            attributes: ["id", "collectionName"],
          },
          {
            model: ProductReview,
            attributes: ['id','rating','comment','userId','productId','createdAt']
          },
          {
            model: Cart
          }
        ],
      });

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      res.status(200).json({
        message: "Product fetched successfully",
        data: product,
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        brand,
        price,
        originalPrice,
        categoryId,
        discount,
        sizes,
        colors,
        features,
        inStock,
        isNew,
        description,
        collectionId,
        totalStock,
        images: imageUrls,
      } = req.body;

      const product = await Shoe.findByPk(id);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      // Handle image field
      let images: string[] = ProductController.transformToArray(imageUrls);
      if (req.files && Array.isArray(req.files)) {
        images = [
          ...images,
          ...(req.files as Express.Multer.File[]).map(
            (file) => `/uploads/${file.filename}`
          ),
        ];
      }
      // If no new images provided, retain existing images
      images = images.length ? images : product.images;

      await product.update({
        name: name ?? product.name,
        brand: brand ?? product.brand,
        price: isNaN(parseFloat(price)) ? product.price : parseFloat(price),
        originalPrice: isNaN(parseFloat(originalPrice))
          ? product.originalPrice
          : parseFloat(originalPrice),
        discount: isNaN(parseFloat(discount))
          ? product.discount
          : parseFloat(discount),
        categoryId: categoryId ?? product.categoryId,
        sizes: sizes ? ProductController.transformToArray(sizes) : product.sizes,
        colors: colors ? ProductController.transformToArray(colors) : product.colors,
        features: features ? ProductController.transformToArray(features) : product.features,
        inStock: inStock !== undefined
          ? inStock === "true" || inStock === true
          : product.inStock,
        isNew: isNew !== undefined
          ? isNew === "true" || isNew === true
          : product.isNew,
        description: description ?? product.description,
        images: images, // ✅ Fixed: was imageUrls
        collectionId: collectionId ?? product.collectionId,
        totalStock: totalStock ? parseInt(totalStock) : product.totalStock,
      });

      res.status(200).json({
        message: "Product updated successfully",
        data: product,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const product = await Shoe.findByPk(id);

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      await product.destroy();

      res.status(201).json({
        message: "Product deleted successfully",
        data: product,
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}

export default new ProductController();