import {Table, Model, Column, DataType, HasMany, AllowNull} from 'sequelize-typescript';
import { UserRoles } from '../enums/user';
import { Todos } from './Todos';
@Table({
    timestamps: false,
    tableName: 'users'
})

export class Users extends Model {
    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    email!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    name!: string

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    password!: string

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    phone!: number

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    address!: string

    @Column({
        type: DataType.ENUM,
        values: Object.values(UserRoles),
        allowNull: false
    })
    role!: string

    @HasMany(() => Todos)
    todos!: Todos[]
}