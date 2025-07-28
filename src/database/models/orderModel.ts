import { Table, Column, Model, DataType, Validate, ForeignKey } from "sequelize-typescript";
import { OrderStatus } from "../../services/types";
import User from "./userModel";
import Payment from "./paymentModel";

@Table({
  tableName: "orders",
  modelName: "Order",
  timestamps: true,
})
class Order extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare firstName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare lastName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [10, 10],
        msg: "Phone number must be 10 digits",
      },
    },
  })
  declare phoneNumber: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare addressLine: string;
    
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare city: string;
  
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare street: string;
  
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare zipcode: string;

    @Column({
        type: DataType.ENUM(OrderStatus.Cancelled, OrderStatus.Delivered, OrderStatus.Ontheway, OrderStatus.Preparation, OrderStatus.Pending),
        defaultValue: OrderStatus.Pending,
    })
    declare orderStatus: OrderStatus;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare email: string;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
    })
    declare totalPrice: number;

   

    @Column({
      type: DataType.STRING,
      defaultValue: '1'
    })
    declare state: string

 



}


export default Order;