import { Request, Response } from "express";
import { Op } from "sequelize";
import Shoe from "../database/models/productModel.js";
import Category from "../database/models/categoryModel.js";
import Order from "../database/models/orderModel.js";
import OrderDetails from "../database/models/orderDetaills.js";
import Cart from "../database/models/cartModel.js";

class RecommendationController {
  /**
   * Get recommendations for the logged-in user based on:
   * 1) All products from last order (if any)
   * 2) Otherwise, all products from last cart
   * 3) Then alsoBought (co-purchases across all those products)
   * 4) Fallback to trending/new products
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      let seedProductIds: string[] = [];
      let seedCategoryIds: string[] = [];
      let source: "order" | "cart" | "none" = "none";

      // Step 1: Get latest order
      const latestOrder = await Order.findOne({
        where: { userId },
        order: [["createdAt", "DESC"]],
        attributes: ["id", "createdAt"],
      });

      if (latestOrder) {
        const orderItems = await OrderDetails.findAll({
          where: { orderId: latestOrder.id },
          include: [{ model: Shoe, include: [Category] }],
        });

        orderItems.forEach((item: any) => {
          if (item.Shoe) {
            seedProductIds.push(item.Shoe.id);
            seedCategoryIds.push(item.Shoe.categoryId);
          }
        });

        if (seedProductIds.length > 0) source = "order";
      }

      // Step 2: If no order, check latest cart
      if (seedProductIds.length === 0) {
        const cartItems = await Cart.findAll({
          where: { userId },
          include: [{ model: Shoe, include: [Category] }],
          order: [["createdAt", "DESC"]],
        });

        cartItems.forEach((item: any) => {
          if (item.Shoe) {
            seedProductIds.push(item.Shoe.id);
            seedCategoryIds.push(item.Shoe.categoryId);
          }
        });

        if (seedProductIds.length > 0) source = "cart";
      }

      // Step 3: Based on category (union of all categories)
      let basedOnCategory: Shoe[] = [];
      if (seedCategoryIds.length > 0) {
        basedOnCategory = await Shoe.findAll({
          where: {
            categoryId: { [Op.in]: seedCategoryIds },
            id: { [Op.notIn]: seedProductIds },
          },
          limit: 12,
        });
      }

      // Step 4: AlsoBought (all co-purchases across all seed products)
      let alsoBought: Shoe[] = [];
      if (seedProductIds.length > 0) {
        const relatedOrders = await OrderDetails.findAll({
          where: { productId: { [Op.in]: seedProductIds } },
          attributes: ["orderId"],
        });

        const orderIds = relatedOrders.map((o: any) => o.orderId);

        if (orderIds.length > 0) {
          const coPurchasedDetails = await OrderDetails.findAll({
            where: {
              orderId: { [Op.in]: orderIds },
              productId: { [Op.notIn]: seedProductIds },
            },
            include: [{ model: Shoe, include: [Category] }],
            limit: 12,
          });

          alsoBought = [
            ...new Map(
              coPurchasedDetails.map((d: any) => [d.Shoe.id, d.Shoe])
            ).values(),
          ];
        }
      }

      // Step 5: Fallback
      let fallback: Shoe[] = [];
      if (
        (!basedOnCategory || basedOnCategory.length === 0) &&
        (!alsoBought || alsoBought.length === 0)
      ) {
        fallback = await Shoe.findAll({
          where: { inStock: true },
          order: [["createdAt", "DESC"]],
          limit: 12,
        });
      }

      // ✅ Response
      res.status(200).json({
        message: "Recommendations fetched successfully",
        source,
        basedOnCategory,
        alsoBought,
        fallback,
      });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({
        message: "Failed to fetch recommendations",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get trending products based on order frequency and recent activity
   */
  async getTrendingProducts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 12 } = req.query;
      
      // Get products ordered in the last 30 days, ordered by frequency
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trendingProducts = await Shoe.findAll({
        include: [
          {
            model: Category,
            attributes: ["id", "categoryName"],
          },
          {
            model: OrderDetails,
            where: {
              createdAt: {
                [Op.gte]: thirtyDaysAgo,
              },
            },
            required: true,
            attributes: [],
          },
        ],
        group: ["Shoe.id"],
        order: [
          [OrderDetails, "createdAt", "DESC"],
          ["createdAt", "DESC"],
        ],
        limit: parseInt(limit as string) || 12,
        subQuery: false,
      });

      res.status(200).json({
        message: "Trending products fetched successfully",
        data: trendingProducts,
        count: trendingProducts.length,
      });
    } catch (error) {
      console.error("Error fetching trending products:", error);
      res.status(500).json({
        message: "Failed to fetch trending products",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get new arrival products (created in last 7 days)
   */
  async getNewArrivals(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 12 } = req.query;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const newArrivals = await Shoe.findAll({
        where: {
          createdAt: {
            [Op.gte]: sevenDaysAgo,
          },
          inStock: true,
        },
        include: [
          {
            model: Category,
            attributes: ["id", "categoryName"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit as string) || 12,
      });

      res.status(200).json({
        message: "New arrivals fetched successfully",
        data: newArrivals,
        count: newArrivals.length,
      });
    } catch (error) {
      console.error("Error fetching new arrivals:", error);
      res.status(500).json({
        message: "Failed to fetch new arrivals",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get best selling products based on total quantity sold
   */
  async getBestSellers(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 12 } = req.query;
      
      const bestSellers = await Shoe.findAll({
        include: [
          {
            model: Category,
            attributes: ["id", "categoryName"],
          },
          {
            model: OrderDetails,
            attributes: [],
            required: true,
          },
        ],
        group: ["Shoe.id"],
        order: [
          [OrderDetails, "quantity", "DESC"],
          ["createdAt", "DESC"],
        ],
        limit: parseInt(limit as string) || 12,
        subQuery: false,
      });

      res.status(200).json({
        message: "Best sellers fetched successfully",
        data: bestSellers,
        count: bestSellers.length,
      });
    } catch (error) {
      console.error("Error fetching best sellers:", error);
      res.status(500).json({
        message: "Failed to fetch best sellers",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get products on sale (with discount)
   */
  async getOnSaleProducts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 12, minDiscount = 10 } = req.query;
      
      const onSaleProducts = await Shoe.findAll({
        where: {
          discount: {
            [Op.gte]: parseInt(minDiscount as string) || 10,
          },
          inStock: true,
        },
        include: [
          {
            model: Category,
            attributes: ["id", "categoryName"],
          },
        ],
        order: [
          ["discount", "DESC"],
          ["createdAt", "DESC"],
        ],
        limit: parseInt(limit as string) || 12,
      });

      res.status(200).json({
        message: "On sale products fetched successfully",
        data: onSaleProducts,
        count: onSaleProducts.length,
      });
    } catch (error) {
      console.error("Error fetching on sale products:", error);
      res.status(500).json({
        message: "Failed to fetch on sale products",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get all collections (trending, new arrivals, best sellers, on sale)
   */
  async getAllCollections(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 8 } = req.query;
      const limitNum = parseInt(limit as string) || 8;

      // Get all collections in parallel
      const [
        trendingProducts,
        newArrivals,
        bestSellers,
        onSaleProducts,
      ] = await Promise.all([
        this.getTrendingProductsData(limitNum),
        this.getNewArrivalsData(limitNum),
        this.getBestSellersData(limitNum),
        this.getOnSaleProductsData(limitNum),
      ]);

      res.status(200).json({
        message: "All collections fetched successfully",
        data: {
          trending: {
            title: "Trending Now",
            products: trendingProducts,
            count: trendingProducts.length,
          },
          newArrivals: {
            title: "New Arrivals",
            products: newArrivals,
            count: newArrivals.length,
          },
          bestSellers: {
            title: "Best Sellers",
            products: bestSellers,
            count: bestSellers.length,
          },
          onSale: {
            title: "On Sale",
            products: onSaleProducts,
            count: onSaleProducts.length,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching all collections:", error);
      res.status(500).json({
        message: "Failed to fetch collections",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Helper methods for getAllCollections
  private async getTrendingProductsData(limit: number) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await Shoe.findAll({
      include: [
        {
          model: Category,
          attributes: ["id", "categoryName"],
        },
        {
          model: OrderDetails,
          where: {
            createdAt: {
              [Op.gte]: thirtyDaysAgo,
            },
          },
          required: true,
          attributes: [],
        },
      ],
      group: ["Shoe.id"],
      order: [
        [OrderDetails, "createdAt", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit,
      subQuery: false,
    });
  }

  private async getNewArrivalsData(limit: number) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return await Shoe.findAll({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
        inStock: true,
      },
      include: [
        {
          model: Category,
          attributes: ["id", "categoryName"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
    });
  }

  private async getBestSellersData(limit: number) {
    return await Shoe.findAll({
      include: [
        {
          model: Category,
          attributes: ["id", "categoryName"],
        },
        {
          model: OrderDetails,
          attributes: [],
          required: true,
        },
      ],
      group: ["Shoe.id"],
      order: [
        [OrderDetails, "quantity", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit,
      subQuery: false,
    });
  }

  private async getOnSaleProductsData(limit: number) {
    return await Shoe.findAll({
      where: {
        discount: {
          [Op.gte]: 10,
        },
        inStock: true,
      },
      include: [
        {
          model: Category,
          attributes: ["id", "categoryName"],
        },
      ],
      order: [
        ["discount", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit,
    });
  }
}

export default new RecommendationController();
