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
   * 1) Last purchased item's category (if any orders)
   * 2) Otherwise, last cart item's category
   * 3) Fallback to trending/new products
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      // Try based on last order first (avoid complex nested aliases)
      const latestOrder = await Order.findOne({
        where: { userId },
        order: [["createdAt", "DESC"]],
        attributes: ["id", "createdAt"],
      });

      let seedCategoryId: string | undefined;
      let seedProductId: string | undefined;

      if (latestOrder) {
        const lastOrderDetail = await OrderDetails.findOne({
          where: { orderId: latestOrder.id },
          order: [["createdAt", "DESC"]],
          include: [
            {
              model: Shoe,
              include: [Category],
            },
          ],
        });
        if (lastOrderDetail && (lastOrderDetail as any).Shoe) {
          const lastProduct = (lastOrderDetail as any).Shoe as any;
          seedProductId = lastProduct.id;
          seedCategoryId = lastProduct.categoryId;
        }
      }

      // If no orders, try based on cart
      if (!seedCategoryId) {
        const lastCartItem = await Cart.findOne({
          where: { userId },
          order: [["createdAt", "DESC"]],
          include: [
            {
              model: Shoe,
              include: [Category],
            },
          ],
        });
        if (lastCartItem && (lastCartItem as any).Shoe) {
          const product = (lastCartItem as any).Shoe as any;
          seedProductId = product.id;
          seedCategoryId = product.categoryId;
        }
      }

      let basedOnCategory: Shoe[] = [] as any;
      if (seedCategoryId) {
        basedOnCategory = (await Shoe.findAll({
          where: {
            // @ts-ignore categoryId exists via association setup
            categoryId: seedCategoryId as any,
            ...(seedProductId ? { id: { [Op.ne]: seedProductId } } : {}),
          },
          limit: 12,
        })) as any;
      }

      // Also-bought heuristic (simplified): other items in same category
      const alsoBought = seedCategoryId
        ? ((await Shoe.findAll({
            where: {
              // @ts-ignore categoryId exists via association setup
              categoryId: seedCategoryId as any,
              ...(seedProductId ? { id: { [Op.ne]: seedProductId } } : {}),
            },
            order: [["createdAt", "DESC"]],
            limit: 12,
          })) as any)
        : ([] as any);

      // Fallback: new/inStock products
      let fallback: Shoe[] = [] as any;
      if ((!basedOnCategory || basedOnCategory.length === 0) && (!alsoBought || alsoBought.length === 0)) {
        fallback = (await Shoe.findAll({
          where: { inStock: true },
          order: [["createdAt", "DESC"]],
          limit: 12,
        })) as any;
      }

      res.status(200).json({
        message: "Recommendations fetched successfully",
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
}

export default new RecommendationController();
