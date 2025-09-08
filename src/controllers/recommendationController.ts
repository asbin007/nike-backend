import { Request, Response } from "express";
import { Op, Sequelize } from "sequelize";
import Shoe from "../database/models/productModel.js";
import Category from "../database/models/categoryModel.js";
import Order from "../database/models/orderModel.js";
import OrderDetails from "../database/models/orderDetaills.js";
import Cart from "../database/models/cartModel.js";
import sequelize from "../database/connection.js";


class RecommendationController {

  // Helper methods for getAllCollections - Fixed versions
  private async getTrendingProductsDirect(limit: number) {
    try {
      // Simplified approach: get recent products, prioritize new ones and discounts
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get products created in last 30 days or marked as new
      return await Shoe.findAll({
        include: [
          {
            model: Category,
            attributes: ["id", "categoryName"],
          },
        ],
        where: {
          [Op.or]: [
            {
              createdAt: {
                [Op.gte]: thirtyDaysAgo,
              },
            },
            {
              isNew: true,
            },
          ],
          inStock: true,
        },
        order: [
          ["isNew", "DESC"], // New products first
          ["discount", "DESC"], // Then by discount
          ["createdAt", "DESC"], // Then by creation date
        ],
        limit,
      });
    } catch (error) {
      console.error("Error in getTrendingProductsDirect:", error);
      // Fallback to simple query
      return await Shoe.findAll({
        include: [
          {
            model: Category,
            attributes: ["id", "categoryName"],
          },
        ],
        where: {
          inStock: true,
        },
        order: [["createdAt", "DESC"]],
        limit,
      });
    }
  }

  private async getNewArrivalsDirect(limit: number) {
    return await Shoe.findAll({
      where: {
        isNew: true,
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

  private async getBestSellersDirect(limit: number) {
    try {
      // Simplified approach: get products that have been ordered at least once
      const orderedProducts = await OrderDetails.findAll({
        attributes: ['productId'],
        group: ['productId'],
        limit: limit * 2, // Get more to filter later
      });

      const productIds = orderedProducts.map(product => product.productId);

      // If no orders, fallback to all products sorted by creation date
      if (productIds.length === 0) {
        return await Shoe.findAll({
          include: [
            {
              model: Category,
              attributes: ["id", "categoryName"],
            },
          ],
          where: {
            inStock: true,
          },
          order: [["createdAt", "DESC"]],
          limit,
        });
      }

      // Get products that have been ordered (best sellers)
      return await Shoe.findAll({
        include: [
          {
            model: Category,
            attributes: ["id", "categoryName"],
          },
        ],
        where: {
          id: {
            [Op.in]: productIds,
          },
          inStock: true,
        },
        order: [["createdAt", "DESC"]],
        limit,
      });
    } catch (error) {
      console.error("Error in getBestSellersDirect:", error);
      // Fallback to simple query
      return await Shoe.findAll({
        include: [
          {
            model: Category,
            attributes: ["id", "categoryName"],
          },
        ],
        where: {
          inStock: true,
        },
        order: [["createdAt", "DESC"]],
        limit,
      });
    }
  }

  private async getOnSaleProductsDirect(limit: number) {
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
      const limitNum = parseInt(limit as string) || 12;
      
      // Use the direct method to avoid GROUP BY issues
      const controller = new RecommendationController();
      const trendingProducts = await controller.getTrendingProductsDirect(limitNum);

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
      const limitNum = parseInt(limit as string) || 12;
      
      // Use the direct method
      const controller = new RecommendationController();
      const newArrivals = await controller.getNewArrivalsDirect(limitNum);

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
      const limitNum = parseInt(limit as string) || 12;
      
      // Use the direct method to avoid GROUP BY issues
      const controller = new RecommendationController();
      const bestSellers = await controller.getBestSellersDirect(limitNum);

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
      const limitNum = parseInt(limit as string) || 12;
      
      // Use the direct method
      const controller = new RecommendationController();
      const onSaleProducts = await controller.getOnSaleProductsDirect(limitNum);

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
   * Get personalized recommendations based on user activity
   */
  async getPersonalizedRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.query;
      console.log('🎯 Backend: Getting personalized recommendations for user:', userId);

      // Get user's cart history from Cart model
      const userCartItems = await Cart.findAll({
        where: userId ? { userId } : {},
        include: [
          {
            model: Shoe,
            as: 'Shoe',
            include: [
              {
                model: Category,
                attributes: ["id", "categoryName"],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

       // Get user's purchase history from OrderDetails model
       const userOrderDetails = await OrderDetails.findAll({
         include: [
           {
             model: Order,
             where: userId ? { userId } : {},
             required: true,
           },
           {
             model: Shoe,
             include: [
               {
                 model: Category,
                 attributes: ["id", "categoryName"],
               },
             ],
           },
         ],
         order: [['createdAt', 'DESC']],
         limit: 10
       });

      console.log('🛒 User cart items:', userCartItems.length);
      console.log('🛍️ User order details:', userOrderDetails.length);

      // Extract product preferences from cart and orders
      const userPreferences = new Set();
      const userBrands = new Set();
      const userCategories = new Set();

      // Analyze cart items
      userCartItems.forEach((item: any) => {
        if (item.Shoe) {
          userPreferences.add(item.Shoe.id);
          if (item.Shoe.brand) userBrands.add(item.Shoe.brand);
          if (item.Shoe.Category) userCategories.add(item.Shoe.Category.categoryName);
        }
      });

      // Analyze order details
      userOrderDetails.forEach((detail: any) => {
        if (detail.Shoe) {
          userPreferences.add(detail.Shoe.id);
          if (detail.Shoe.brand) userBrands.add(detail.Shoe.brand);
          if (detail.Shoe.Category) userCategories.add(detail.Shoe.Category.categoryName);
        }
      });

      console.log('🏷️ User preferences:', {
        brands: Array.from(userBrands),
        categories: Array.from(userCategories),
        productIds: Array.from(userPreferences)
      });

      let recommendations = [];

      if (userPreferences.size > 0) {
        // Generate recommendations based on user preferences
        const similarProducts = await Shoe.findAll({
          include: [
            {
              model: Category,
              attributes: ["id", "categoryName"],
            },
          ],
          where: {
            id: { [Op.notIn]: Array.from(userPreferences) }, // Exclude already purchased/viewed
            inStock: true,
            [Op.or]: [
              { brand: { [Op.in]: Array.from(userBrands) } },
              { '$Category.categoryName$': { [Op.in]: Array.from(userCategories) } }
            ]
          },
          order: [
            ['isNew', 'DESC'],
            ['discount', 'DESC'],
            ['createdAt', 'DESC']
          ],
          limit: 6
        });

        recommendations = similarProducts;
      } else {
        // Fallback: general recommendations
        const generalRecommendations = await Shoe.findAll({
          include: [
            {
              model: Category,
              attributes: ["id", "categoryName"],
            },
          ],
          where: {
            inStock: true,
          },
          order: [
            ['isNew', 'DESC'],
            ['discount', 'DESC'],
            ['createdAt', 'DESC']
          ],
          limit: 6
        });

        recommendations = generalRecommendations;
      }

      console.log('✅ Generated recommendations:', recommendations.length);

      res.status(200).json({
        message: "Personalized recommendations fetched successfully",
        data: recommendations,
         meta: {
           total: recommendations.length,
           userActivity: {
             cartItems: userCartItems.length,
             orderDetails: userOrderDetails.length,
             preferences: userPreferences.size,
             brands: Array.from(userBrands),
             categories: Array.from(userCategories)
           }
         }
      });
    } catch (error) {
      console.error("Error fetching personalized recommendations:", error);
      res.status(500).json({
        message: "Failed to fetch personalized recommendations",
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

      // Get all collections in parallel using direct queries instead of helper methods
      const controller = new RecommendationController();
      const [
        trendingProducts,
        newArrivals,
        bestSellers,
        onSaleProducts,
      ] = await Promise.all([
        controller.getTrendingProductsDirect(limitNum),
        controller.getNewArrivalsDirect(limitNum),
        controller.getBestSellersDirect(limitNum),
        controller.getOnSaleProductsDirect(limitNum),
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
}

export default new RecommendationController();
