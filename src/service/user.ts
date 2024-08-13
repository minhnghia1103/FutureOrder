import { UsersRepository } from "../repository/users";
import { Users } from "../entity/Users";
import { UserInfor } from "../dtos/res/userInfor";
import { Register } from "../dtos/req/register";
import { ChangePassword } from "../dtos/req/changePassword";

export class UserService {
    private usersRepository: UsersRepository;

    constructor() {
        this.usersRepository = new UsersRepository();
    }

    public async getAllUsers() {
        return await this.usersRepository.findAll();
    }

    public async getUserById(id: number): Promise<UserInfor | null>{
        const user = await this.usersRepository.findById(id);
        if (!user) {
            return null;
        }
        // Ánh xạ từ Users sang UserInfor
        const userInfor: UserInfor = {
            email: user.email,
            name: user.name,
            phone: user.phone,
            address: user.address
        };
        return userInfor;
    }

    public async createUser(user: Register): Promise<Register | null>{
        return await this.usersRepository.create(user);
    }

    public async changePassword(id: number, changePasswordDto: ChangePassword): Promise<boolean> {
        const user = await this.usersRepository.findById(id);
        if (!user) {
            throw new Error("User not found");
        }

        if (user.password !== changePasswordDto.oldPassword) {
            throw new Error("Old password is incorrect");
        }

        if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
            throw new Error("New password and confirmation do not match");
        }

        user.password = changePasswordDto.newPassword;
        await this.usersRepository.update(id, user);
        return true;
    }

    public async delete(id: number) {
        return await this.usersRepository.delete(id);
    }
}