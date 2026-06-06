import { validateSync } from 'class-validator';
import { CreateUserDto } from './src/users/dto/create-user.dto';
import { UserRole } from './src/users/entities/user.entity';

const dto = new CreateUserDto();
dto.name = 'Test';
dto.email = 'test@test.com';
dto.password = 'password';
dto.role = 'student' as any;

const errors = validateSync(dto);
console.log('Errors for "student":', errors.length > 0 ? errors[0].constraints : 'No errors');

dto.role = 'STUDENT' as any;
const errors2 = validateSync(dto);
console.log('Errors for "STUDENT":', errors2.length > 0 ? errors2[0].constraints : 'No errors');
