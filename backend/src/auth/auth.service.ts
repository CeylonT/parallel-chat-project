import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/user.model';
import { compareSync } from 'bcryptjs';
import { AuthCredentialsDTO } from './auth.dto';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly chatService: ChatService,
  ) {}

  async login(credentials: AuthCredentialsDTO): Promise<string> {
    const user = await this.validateUser(credentials);
    if (!user) {
      throw new UnauthorizedException('username or password is incorrect');
    }
    return this.sign(user);
  }

  async register(userDTO: User): Promise<string> {
    if (await this.userService.findOne({ username: userDTO.username })) {
      throw new BadRequestException('username ID already exists');
    }
    const user = await this.userService.create(userDTO);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.sign(user);
  }

  async validateUser({
    username,
    password,
  }: AuthCredentialsDTO): Promise<User> {
    const user: User = await this.userService.findOne({ username }, true);
    if (user && compareSync(password, user.password)) {
      return user;
    }
    return null;
  }

  async sign(user: User): Promise<any> {
    const token = await this.jwtService.sign({ userId: user._id });
    const rooms = await this.chatService.findByUsername(user.username);
    return { token, rooms };
  }

  verify(jwt: string): { userId: string } {
    return this.jwtService.verify(jwt);
  }
}
