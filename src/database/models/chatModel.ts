import { Table,Column,DataType,Model, ForeignKey, BelongsTo } from "sequelize-typescript";
import User from "./userModel.js";

@Table({
    tableName:'chats',
    modelName:"Chat",
    timestamps:true

})

class Chat extends Model{
    @Column({
        primaryKey:true,
        type:DataType.UUID,
        defaultValue:DataType.UUIDV4
    })
    declare id: string;

    
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare adminId: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare customerId: string;

  @BelongsTo(() => User, "adminId")
  admin!: User;

  @BelongsTo(() => User, "customerId")
  customer!: User;
}

export default Chat;