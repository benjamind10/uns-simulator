// Set JWT_SECRET before any imports
process.env.JWT_SECRET = 'test-secret';

const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockFindOne = jest.fn();
const mockSave = jest.fn();
const mockBrokerFind = jest.fn();

jest.mock('../../graphql/models/User', () => {
  const MockUser = jest.fn().mockImplementation((data: any) => ({
    ...data,
    save: (...args: any[]) => mockSave(...args),
  }));
  (MockUser as any).find = (...args: any[]) => mockFind(...args);
  (MockUser as any).findById = (...args: any[]) => mockFindById(...args);
  (MockUser as any).findOne = (...args: any[]) => mockFindOne(...args);
  return { __esModule: true, default: MockUser };
});

jest.mock('../../graphql/models/Broker', () => ({
  __esModule: true,
  default: {
    find: (...args: any[]) => mockBrokerFind(...args),
  },
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  },
}));

// Require after mocks are set up
const { userResolvers } = require('../../graphql/resolvers/user.resolver');

describe('userResolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.users', () => {
    it('returns all users', async () => {
      const mockUsers = [{ username: 'user1' }, { username: 'user2' }];
      mockFind.mockResolvedValue(mockUsers);

      const result = await userResolvers.Query.users();

      expect(result).toEqual(mockUsers);
    });
  });

  describe('Query.user', () => {
    it('returns a user by id', async () => {
      const mockUser = { _id: 'user-1', username: 'testuser' };
      mockFindById.mockResolvedValue(mockUser);

      const result = await userResolvers.Query.user({}, { id: 'user-1' });

      expect(result).toEqual(mockUser);
    });
  });

  describe('Mutation.createUser', () => {
    it('creates and saves a new user', async () => {
      const input = {
        username: 'newuser',
        email: 'new@test.com',
        password: 'password123',
      };
      mockSave.mockResolvedValue({ ...input, _id: 'new-id' });

      await userResolvers.Mutation.createUser({}, { input });

      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('Mutation.login', () => {
    it('returns token and user on valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      mockFindOne.mockResolvedValue(mockUser);

      const result = await userResolvers.Mutation.login(
        {},
        { input: { email: 'test@test.com', password: 'correct' } }
      );

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).toBe(mockUser);
    });

    it('throws on unknown email', async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(
        userResolvers.Mutation.login(
          {},
          { input: { email: 'bad@test.com', password: 'x' } }
        )
      ).rejects.toThrow('Invalid credentials');
    });

    it('throws on wrong password', async () => {
      const mockUser = {
        id: 'user-1',
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      mockFindOne.mockResolvedValue(mockUser);

      await expect(
        userResolvers.Mutation.login(
          {},
          { input: { email: 'test@test.com', password: 'wrong' } }
        )
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('User.brokers', () => {
    it('returns brokers for the user', async () => {
      const parentUser = { brokers: ['b1', 'b2'] };
      const mockBrokers = [{ _id: 'b1' }, { _id: 'b2' }];
      mockBrokerFind.mockResolvedValue(mockBrokers);

      const result = await userResolvers.User.brokers(parentUser as any);

      expect(result).toEqual(mockBrokers);
      expect(mockBrokerFind).toHaveBeenCalledWith({
        _id: { $in: ['b1', 'b2'] },
      });
    });
  });
});
