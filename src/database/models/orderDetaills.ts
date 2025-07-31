import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from "sequelize-typescript";
import Order from "./orderModel.js";
import Shoe from "./productModel.js";

@Table({
  tableName: "orderDetails",
  modelName: "OrderDetails",
  timestamps: true,
})
class OrderDetails extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare quantity: number;

}

export default OrderDetails;
