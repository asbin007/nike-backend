import { Table, Column, Model, DataType, ForeignKey } from "sequelize-typescript";
import Shoe from "./productModel.js";
import User from "./userModel.js";

@Table({
  tableName: "carts",
  modelName: "Cart",
  timestamps: true,
})
class Cart extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  declare productId: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare quantity: number;

  @Column({
    type: DataType.STRING,
  })
  declare size: string;

  @Column({
    type: DataType.STRING,
  })
  declare color: string; 

}

export default Cart;