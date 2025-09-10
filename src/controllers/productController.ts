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
    const {
      name,
      brand,
      price,
      originalPrice,
      costPrice,
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
    } = req.body;

    // Handle image field
    let images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      images = (req.files as Express.Multer.File[]).map(
        (file) => `/uploads/${file.filename}`
      );
    }

    const product = await Shoe.create({
      name,
      brand,
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice),
      costPrice: parseFloat(costPrice),
      discount: parseFloat(discount),
      categoryId,
      sizes: sizes ? sizes.split(",") : [],
      colors: colors ? colors.split(",") : [],
      features: features ? features.split(",") : [],
      inStock: inStock === "true" || inStock === true,
      isNew: isNew === "true" || isNew === true,
      description,
      images,
      collectionId,
      totalStock: parseInt(totalStock),
    });

    res.status(201).json({
      message: "Product created successfully",
      data: product,
    });
  }

  async getAllProducts(req: Request, res: Response): Promise<void> {
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
  }

  async getSingleProduct(req: Request, res: Response): Promise<void> {
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
          attributes:['id','rating','comment','userId','productId','createdAt']
        },
        {
          model:Cart
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
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const {
      name,
      brand,
      price,
      originalPrice,
      costPrice,
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

    const updateData = {
      name: name ?? product.name,
      brand: brand ?? product.brand,
      price: isNaN(parseFloat(price)) ? product.price : parseFloat(price),
      originalPrice: isNaN(parseFloat(originalPrice))
        ? product.originalPrice
        : parseFloat(originalPrice),
      costPrice: isNaN(parseFloat(costPrice))
        ? product.costPrice
        : parseFloat(costPrice),
      discount: isNaN(parseFloat(discount))
        ? product.discount
        : parseFloat(discount),
      categoryId,
      sizes: sizes ? sizes.split(",") : product.sizes,
      colors: colors ? colors.split(",") : product.colors,
      features: features ? features.split(",") : product.features,
      inStock:
        inStock !== undefined
          ? inStock === "true" || inStock === true
          : product.inStock,
      isNew:
        isNew !== undefined
          ? isNew === "true" || isNew === true
          : product.isNew,
      description: description ?? product.description,
      images: imageUrls,
      collectionId,
      totalStock: totalStock || product.totalStock,
    };
    
    await product.update(updateData);

    res.status(200).json({
      message: "Product updated successfully",
      data: product,
    });
  }

  async deleteProduct(req: Request, res: Response): Promise<void> {
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
  }

  // Get profit analysis for all products
  async getProfitAnalysis(req: Request, res: Response): Promise<void> {
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

      const profitAnalysis = products.map((product) => {
        const sellingPrice = product.price;
        const costPrice = product.costPrice;
        const profit = sellingPrice - costPrice;
        const profitPercentage = costPrice > 0 ? ((profit / costPrice) * 100) : 0;

        return {
          id: product.id,
          name: product.name,
          brand: product.brand,
          sellingPrice,
          costPrice,
          profit,
          profitPercentage: Math.round(profitPercentage * 100) / 100,
          totalStock: product.totalStock,
          totalProfit: profit * (product.totalStock as number),
          category: (product as any).Category?.categoryName,
          collection: (product as any).Collection?.collectionName,
        };
      });

      // Calculate total profit
      const totalProfit = profitAnalysis.reduce((sum, product) => sum + product.totalProfit, 0);
      const totalProducts = products.length;
      const averageProfitPercentage = profitAnalysis.reduce((sum, product) => sum + product.profitPercentage, 0) / totalProducts;

      res.status(200).json({
        message: "Profit analysis fetched successfully",
        data: {
          products: profitAnalysis,
          summary: {
            totalProducts,
            totalProfit: Math.round(totalProfit * 100) / 100,
            averageProfitPercentage: Math.round(averageProfitPercentage * 100) / 100,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching profit analysis",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

}

export default new ProductController();
