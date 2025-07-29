

import { Table,Column,DataType,Model, BelongsTo, ForeignKey } from "sequelize-typescript";
import User from "./userModel";
import Chat from "./chatModel";

@Table({
    tableName:'messages',
    modelName:"Message",
    timestamps:true

})

class Message extends Model{
    @Column({
        primaryKey:true,
        type:DataType.UUID,
        defaultValue:DataType.UUIDV4
    })
    declare id: string;


      @ForeignKey(() => Chat)
  @Column(DataType.UUID)
  declare chatId: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare senderId: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare receiverId: string;

  @Column(DataType.TEXT)
  declare content: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare imageUrl: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare read: boolean;

  @BelongsTo(() => Chat)
  chat!: Chat;

  @BelongsTo(() => User, "senderId")
  sender!: User;

  @BelongsTo(() => User, "receiverId")
  receiver!: User;
}

export default Message;