import { Router } from "express";
import { TodosController } from "../controllers/todosInfor";

const router = Router();
const todosController: TodosController = new TodosController();
//Lấy todo theo userId
router.get('/', todosController.getAllTodos.bind(todosController));

//Lấy todo theo id
router.get('/:id', todosController.getTodoById.bind(todosController));

//Tạo todo theo userId
router.post('/', todosController.createByUser.bind(todosController));

//xóa todo theo id
router.delete('/:id', todosController.delete.bind(todosController));

export default router;