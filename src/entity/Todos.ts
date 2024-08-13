import {Table, Model, Column, DataType, HasOne, ForeignKey} from 'sequelize-typescript';
import { Users } from './Users';
@Table({
    timestamps: true,
    tableName: 'todos'
})

export class Todos extends Model {
    @ForeignKey(() => Users)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    userId!: number;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    title!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    description!: string
}