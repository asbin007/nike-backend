// controllers/cartController.ts
import { Request, Response } from "express";
import Cart from "../database/models/cartModel";
import Shoe from "../database/models/productModel";

class CartController {
  async addToCart(req: Request, res: Response) {
    const userId = req.user?.id;
    const { productId, quantity, size, color } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!productId || !quantity || !size || !color) {
      return res.status(400).json({
        message: "Missing required fields: productId, quantity, size, color",
      });
    }

    const product = await Shoe.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!product.sizes.includes(size)) {
      return res.status(400).json({ message: "Invalid size selected" });
    }
    if (!product.colors.includes(color)) {
      return res.status(400).json({ message: "Invalid color selected" });
    }

    let userKoCartExist = await Cart.findOne({
      where: { userId, productId, size, color }, // Include color in check
    });

    if (userKoCartExist) {
      userKoCartExist.quantity += quantity;
      await userKoCartExist.save();
    } else {
      await Cart.create({ userId, productId, quantity, size, color });
    }

    const cartData = await Cart.findAll({
      where: { userId },
      include: [
        {
          model: Shoe,
          attributes: ["id", "name", "price", "images", "sizes", "colors"],
        },
      ],
    });

    return res.status(201).json({
      message: "Product added to cart successfully",
      data: cartData,
    });
  }

  async getCart(req: Request, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const cartData = await Cart.findAll({
      where: { userId },
      include: [
        {
          model: Shoe,
          attributes: ["id", "name", "price", "images"],
        },
      ],
    });

    return res.status(201).json({
      message: "Cart fetched successfully",
      data: cartData,
    });
  }

  async removeFromCart(req: Request, res: Response) {
    const userId = req.user?.id;
    const { productId } = req.params;
    const product = await Shoe.findByPk(productId);

    if (!productId) {
      return res.status(400).json({ message: "Product ID required" });
    }

    await Cart.destroy({
      where: { userId, productId },
    });

    return res.status(201).json({
      message: "Product removed from cart successfully",
    });
  }

  async updateCart(req: Request, res: Response) {
    const userId = req.user?.id;
    const{ productId} = req.params;
    const { quantity } = req.body;
    if (!quantity) {
      res.status(400).json({
        message: "Please provide quantity",
      });
      return;
    }
    const cartItem = await Cart.findOne({
      where: {
        userId,
        productId,
      },
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    } else {
      cartItem.quantity = quantity;
      await cartItem.save();

      res.status(201).json({
        message: "Cart item updated successfully",
        data: cartItem,
      });
    }
  }
}

export default new CartController();
