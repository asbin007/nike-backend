import { Table, Column, DataType, Model } from "sequelize-typescript";
import { PaymentMethod, PaymentStatus } from "../../services/types.js";

@Table({
  tableName: "payments",
  modelName: "Payment",
  timestamps: true,
})
class Payment extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.ENUM(
      PaymentMethod.COD,
      PaymentMethod.Esewa,
      PaymentMethod.Khalti
    ),
    
  })
  declare paymentMethod: string;

  @Column({
    type: DataType.ENUM(PaymentStatus.Paid, PaymentStatus.Unpaid),
    defaultValue: PaymentStatus.Unpaid 
  })
  declare paymentStatus: string;

  @Column({
    type:DataType.STRING
  })
  declare pidx:string


}

export default Payment;
