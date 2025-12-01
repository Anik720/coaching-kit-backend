import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';


export class CreateGroupDto {
@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
@IsString()
@IsNotEmpty()
groupName: string;
}