import { TodosRepository } from "../repository/todos";
import { Todos } from "../entity/Todos";
import { TodoInfor } from "../dtos/res/todo";
import { ChangeTodo } from "../dtos/req/changeTodo";

export class TodosService {
    private todosRepository: TodosRepository;

    constructor() {
        this.todosRepository = new TodosRepository();
    }

    public async getAllTodosByUserId(userId: number): Promise<Todos[]> {
        return this.todosRepository.findAllByUserId(userId);
    }

    public async getTodoById(id: number): Promise<Todos | null>{
        return await this.todosRepository.findById(id);
    }

    public async createTodos(todo: TodoInfor): Promise<TodoInfor | null>{
        return await this.todosRepository.create(todo);
    }

    public async update(id: number, todo: ChangeTodo) {
        return await this.todosRepository.update(id, todo);
    }

    public async delete(id: number) {
        return await this.todosRepository.delete(id);
    }
    public async deleteByUser(userId: number,id: number) {
        return await this.todosRepository.deleteByUser(userId,id);
    }
    public async createByUser(userId: number,todo: TodoInfor) {
        return await this.todosRepository.createByUser(userId,todo);
    }
}