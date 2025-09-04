import { Table, Column, Model, DataType, Validate, ForeignKey, BelongsTo, HasOne } from "sequelize-typescript";
import { OrderStatus } from "../../services/types.js";
import User from "./userModel.js";
import Payment from "./paymentModel.js";

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

 



    @ForeignKey(() => User)
    @Column({
      type: DataType.UUID,
      allowNull: false,
    })
    declare userId: string;

    @ForeignKey(() => Payment)
    @Column({
      type: DataType.UUID,
      allowNull: false,
    })
    declare paymentId: string;

    @BelongsTo(() => User)
    declare User: User;

    @BelongsTo(() => Payment)
    declare Payment: Payment;
}


export default Order;