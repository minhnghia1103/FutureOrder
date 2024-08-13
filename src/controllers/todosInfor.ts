import { Request, Response } from "express";
import { TodosService } from "../service/todos";
import { TodoInfor } from "../dtos/res/todo";
import { ChangeTodo } from "../dtos/req/changeTodo";

export class TodosController{
    private todosService: TodosService;

    constructor() {
        this.todosService = new TodosService();
    }

    //Lấy todo theo userId
    public async getAllTodos(req: Request, res: Response): Promise<void> {
        const userIdParam = req.query.userId as string;
        const id = parseInt(userIdParam, 10); 
        try {
            const todos: TodoInfor[] = await this.todosService.getAllTodosByUserId(id);
            res.status(200).json(todos);
        } catch (error) {
            res.status(500).send({ message: "Server error", error });
        }
    }

    public async getTodoById(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).send({ message: "Invalid todo ID" });
            return;
        }

        try {
            const todo: TodoInfor | null = await this.todosService.getTodoById(id);
            if (todo) {
                res.status(200).json(todo);
            } else {
                res.status(404).send({ message: "Todo not found" });
            }
        } catch (error) {
            res.status(500).send({ message: "Server error", error });
        }
    }

    public async create(req: Request, res: Response): Promise<void> {
        const todo: TodoInfor = req.body;
        try {
            const newTodo: TodoInfor | null = await this.todosService.createTodos(todo);
            res.status(201).json(newTodo);
        } catch (error) {
            res.status(500).send({ message: "Server error", error });
        }
    }

    public async update(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).send({ message: "Invalid todo ID" });
            return;
        }

        const todo: ChangeTodo = req.body;
        try {
            const updatedTodo: ChangeTodo | null = await this.todosService.update(id, todo);
            if (updatedTodo) {
                res.status(200).json(updatedTodo);
            } else {
                res.status(404).send({ message: "Todo not found" });
            }
        } catch (error) {
            res.status(500).send({ message: "Server error", error });
        }
    }

    public async delete(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).send({ message: "Invalid todo ID" });
        }

        try {
            await this.todosService.delete(id);
            res.status(200).send({ message: "Todo deleted successfully" });
        } catch (error) {
            res.status(500).send({ message: "Server error", error });
        }
    }
    public async deleteByUser(req: Request, res: Response): Promise<void> {
        const userId = parseInt(req.query.userId as string, 10);
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).send({ message: "Invalid todo ID" });
        }

        try {
            await this.todosService.deleteByUser(userId,id);
            res.status(200).send({ message: "Todo deleted successfully" });
        } catch (error) {
            res.status(500).send({ message: "Server error", error });
        }
    }
    public async createByUser(req: Request, res: Response): Promise<void> {
        const userId = parseInt(req.query.userId as string, 10);
        const todo: TodoInfor = req.body;
        try {
            const newTodo: TodoInfor | null = await this.todosService.createByUser(userId,todo);
            res.status(201).json(newTodo);
        } catch (error) {
            res.status(500).send({ message: "Server error", error });
        }
    }
}