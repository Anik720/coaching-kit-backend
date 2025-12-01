import {
Controller,
Get,
Post,
Body,
Param,
Put,
Delete,
Query,
ParseIntPipe,
DefaultValuePipe,
UsePipes,
ValidationPipe,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupService } from './group.service';



@Controller('academic/group')
export class GroupController {
constructor(private readonly groupService: GroupService) {}


@Post()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
create(@Body() dto: CreateGroupDto) {
return this.groupService.create(dto);
}


@Get()
findAll(
@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
@Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
) {
return this.groupService.findAll({ page, limit });
}


@Get(':id')
findOne(@Param('id') id: string) {
return this.groupService.findOne(id);
}


@Put(':id')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
return this.groupService.update(id, dto);
}


@Delete(':id')
remove(@Param('id') id: string) {
return this.groupService.remove(id);
}
}