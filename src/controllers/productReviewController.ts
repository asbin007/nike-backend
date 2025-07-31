import { Request, Response } from "express";
import Shoe from "../database/models/productModel.js";
import ProductReview from "../database/models/productReviewModal.js";
import User from "../database/models/userModel.js";



class ReviewController {
  async postReview(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { rating, comment, productId } = req.body;

    if (!rating || !comment || !productId) {
      res.status(400).json({
        message: "Missing required fields: rating, comment, or productId",
      });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ message: "Rating must be between 1 and 5" });
      return;
    }

    if (comment.length < 10 || comment.length > 1000) {
      res.status(400).json({
        message: "Comment must be between 10 and 1000 characters",
      });
      return;
    }

    // Verify product exists
    const productExists = await Shoe.findByPk(productId);
    if (!productExists) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const review = await ProductReview.create({
      userId,
      rating,
      comment,
      productId,
    });

    // fetch full review with associated User
    const fullReview = await ProductReview.findOne({
      where: { id: review.id },
      include: [
        {
          model: User,
          attributes: ["id", "username"],
        },
      ],
    });

    res.status(200).json({
      message: "Review created successfully",
      data: fullReview,
    });
  }

  async getAllReviews(req: Request, res: Response): Promise<void> {
    const data = await ProductReview.findAll({
      include: [
        {
          model: User,
          attributes: ["username", "id"],
        },
      ],
    });

    if (data.length === 0) {
      res.status(404).json({
        message: "No reviews found",
      });
      return;
    }

    res.status(200).json({
      message: "Reviews retrieved successfully",
      data,
    });
  }

  async getReviewByProductId(req: Request, res: Response): Promise<void> {
    const { productId } = req.params;
    if (!productId) {
      res.status(400).json({ message: "Product ID is required" });
      return;
    }

    const data = await ProductReview.findAll({
      where: { productId },
      include: [
        {
          model: User,
          attributes: ["username", "id"],
        },
      ],
    });

    res.status(200).json({
      message: "Reviews retrieved successfully",
      data,
    });
  }

  async deleteReview(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    // User can only delete their own review
    const review = await ProductReview.findOne({
      where: { id, userId },
    });

    if (!review) {
      res.status(404).json({
        message:
          "Review not found or you do not have permission to delete this review",
      });
      return;
    }

    await ProductReview.destroy({
      where: { id, userId },
    });

    res.status(200).json({
      message: "Review deleted successfully",
    });
  }

  async updateReview(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id; // guaranteed by middleware
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      res.status(400).json({
        message: "Rating and comment are required",
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
      return;
    }

    // User can only update their own review
    const review = await ProductReview.findOne({
      where: { id, userId },
    });

    if (!review) {
      res.status(404).json({
        message:
          "Review not found or you do not have permission to update this review",
      });
      return;
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    res.status(200).json({
      message: "Review updated successfully",
      data: await ProductReview.findOne({
        where: { id: review.id },
        include: [{ model: User, attributes: ["id", "username"] }],
      }),
    });
  }
}

export default new ReviewController();
