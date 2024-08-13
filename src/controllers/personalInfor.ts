import { Request, Response } from "express";
import { UserService } from "../service/user";
import { UserInfor } from "../dtos/res/userInfor";
import { Register } from "../dtos/req/register";
import { ChangePassword } from "../dtos/req/changePassword";

export class PersonalController{
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    public async getUserById(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).send({ message: "Invalid user ID" });
            return;
        }

        try {
            const user: UserInfor | null = await this.userService.getUserById(id);
            if (user) {
                res.status(200).json(user);
            } else {
                res.status(404).send({ message: "User not found" });
            }
        } catch (error) {
            res.status(500).send({ message: "Server error", error });
        }
        
    }

    public async createUser(req: Request, res: Response): Promise<void> {
        const user: Register = req.body;
        try {
            const newUser: Register | null = await this.userService.createUser(user);
            res.status(201).json(newUser);
        } catch (error) {
            res.status(500).send({ message: "Server error", error });
        }
    }

    public async delete(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).send({ message: "Invalid user ID" });
        }

        try {
            await this.userService.delete(id);
            res.status(200).send({ message: "User deleted successfully" });
        } catch (error) {
            res.status(500).send({ message: "Server error", error });
        }
    }

    public async changePassword(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).send({ message: "Invalid user ID" });
            return;
        }

        const changePasswordDto: ChangePassword = req.body;
        try {
            const result = await this.userService.changePassword(id, changePasswordDto);
            if (result) {
                res.status(200).send({ message: "Password changed successfully" });
            }
        } catch (error) {
            res.status(500).send({ message: "Server error", error });
        }
    }
}