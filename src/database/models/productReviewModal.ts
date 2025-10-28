import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from "sequelize-typescript";
import User from "./userModel.js";
import Shoe from "./productModel.js";

@Table({
  tableName: "product_reviews",
  modelName: "ProductReview",
  timestamps: true,
})
class ProductReview extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  })
  declare rating: number;


  @Column({
    type: DataType.TEXT,
    validate: {
      len: [10, 1000],
    },
  })
  declare comment: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  @ForeignKey(() => Shoe)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare productId: string;
}

export default ProductReview;
