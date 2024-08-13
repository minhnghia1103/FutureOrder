
import { PersonalController } from '../controllers/personalInfor';
import { Router } from 'express';

const router = Router();
const personalController: PersonalController = new PersonalController();


//Lấy thông tin cá nhân theo id
router.get('/:id', personalController.getUserById.bind(personalController));


//Tạo thông tin cá nhân
router.post('/', personalController.createUser.bind(personalController));

//Cập nhật thông tin cá nhân theo id
router.put('/:id', personalController.changePassword.bind(personalController));

//Xóa thông tin cá nhân theo id
router.delete('/:id', personalController.delete.bind(personalController));

export default router;
