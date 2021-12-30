import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import { validate as uuidValidate } from 'uuid';
import orchestratorFactory from 'tests/orchestrator.js';

const orchestrator = orchestratorFactory();

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/users', () => {
  describe('in an empty database', () => {
    test('should return an empty array', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual([]);
    });
  });

  describe('GET /api/v1/users/:username', () => {
    describe('if "username" does not exists', () => {
      test('should return a NotFound error', async () => {
        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/donotexist`);
        const responseBody = await response.json();

        expect(response.status).toEqual(404);
        expect(responseBody.name).toEqual('NotFoundError');
        expect(responseBody.message).toEqual('O username "donotexist" não foi encontrado no sistema.');
        expect(responseBody.action).toEqual('Verifique se o "username" está digitado corretamente.');
        expect(uuidVersion(responseBody.errorId)).toEqual(4);
        expect(uuidValidate(responseBody.errorId)).toEqual(true);
        expect(uuidVersion(responseBody.requestId)).toEqual(4);
        expect(uuidValidate(responseBody.requestId)).toEqual(true);
      });
    });

    describe('if "username" does exists (same uppercase letters)', () => {
      test('should return the user object', async () => {
        const userCreatedResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'userNameToBeFound',
            email: 'userEmail@gmail.com',
            password: 'validpassword',
          }),
        });

        const userFindResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/userNameToBeFound`);
        const userFindResponseBody = await userFindResponse.json();

        expect(userFindResponse.status).toEqual(200);
        expect(uuidVersion(userFindResponseBody.id)).toEqual(4);
        expect(uuidValidate(userFindResponseBody.id)).toEqual(true);
        expect(userFindResponseBody.username).toEqual('userNameToBeFound');
        expect(userFindResponseBody.email).toEqual('useremail@gmail.com');
      });
    });
    describe('if "username" does exists (different uppercase letters)', () => {
      test('should return the user object', async () => {
        const userCreatedResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'userNameToBeFoundCAPS',
            email: 'userEmailToBeFoundCAPS@gmail.com',
            password: 'validpassword',
          }),
        });

        const userFindResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/usernametobefoundcaps`);
        const userFindResponseBody = await userFindResponse.json();

        expect(userFindResponse.status).toEqual(200);
        expect(uuidVersion(userFindResponseBody.id)).toEqual(4);
        expect(uuidValidate(userFindResponseBody.id)).toEqual(true);
        expect(userFindResponseBody.username).toEqual('userNameToBeFoundCAPS');
        expect(userFindResponseBody.email).toEqual('useremailtobefoundcaps@gmail.com');
      });
    });
  });
});

describe('POST /api/v1/users', () => {
  describe('with unique and valid data', () => {
    test('should return the created user', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'uniqueUserName',
          email: 'validemailCAPS@gmail.com',
          password: 'validpassword',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidValidate(responseBody.id)).toEqual(true);
      expect(responseBody.username).toEqual('uniqueUserName');
      expect(responseBody.email).toEqual('validemailcaps@gmail.com');
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody).not.toHaveProperty('password');
    });
  });

  describe('with "username" duplicated exactly (same uppercase letters)', () => {
    test('should return a validation error', async () => {
      const firstResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'SaMeUPPERCASE',
          email: 'email01@gmail.com',
          password: 'validpassword',
        }),
      });

      const secondResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'SaMeUPPERCASE',
          email: 'email02@gmail.com',
          password: 'validpassword',
        }),
      });

      const secondResponseBody = await secondResponse.json();
      expect(secondResponse.status).toEqual(400);
      expect(secondResponseBody.name).toEqual('ValidationError');
      expect(secondResponseBody.message).toEqual('O username "SaMeUPPERCASE" já está sendo usado.');
      expect(secondResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(secondResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(secondResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" duplicated (different uppercase letters)', () => {
    test('should return a validation error', async () => {
      const firstResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'DIFFERENTuppercase',
          email: 'email03@gmail.com',
          password: 'validpassword',
        }),
      });

      const secondResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'differentUPPERCASE',
          email: 'email04@gmail.com',
          password: 'validpassword',
        }),
      });

      const secondResponseBody = await secondResponse.json();
      expect(secondResponse.status).toEqual(400);
      expect(secondResponseBody.name).toEqual('ValidationError');
      expect(secondResponseBody.message).toEqual('O username "differentUPPERCASE" já está sendo usado.');
      expect(secondResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(secondResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(secondResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" missing', () => {
    test('should return a validation error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'valid@email.com',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" é um campo obrigatório.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" with an empty string', () => {
    test('should return a validation error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: '',
          email: 'valid@email.com',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" that\'s not a String', () => {
    test('should return a validation error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 12345,
          email: 'valid@email.com',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" containing non alphanumeric characters', () => {
    test('should return a validation error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'invalid!user_name',
          email: 'valid@email.com',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter apenas caracteres alfanuméricos.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" too short', () => {
    test('should return a validation error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'ab',
          email: 'valid@email.com',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter no mínimo 3 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" too long', () => {
    test('should return a validation error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'userNameTooLooooooooooooooooooooooooooog',
          email: 'valid@email.com',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter no máximo 30 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "email" duplicated (same uppercase letters)', () => {
    test('should return a validation error', async () => {
      const firstResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'anotherUserName111',
          email: 'email.will.be.duplicated@gmail.com',
          password: 'validpassword',
        }),
      });

      const secondResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'anotherUserName222',
          email: 'email.will.be.duplicated@gmail.com',
          password: 'validpassword',
        }),
      });

      const secondResponseBody = await secondResponse.json();
      expect(secondResponse.status).toEqual(400);
      expect(secondResponseBody.name).toEqual('ValidationError');
      expect(secondResponseBody.message).toEqual('O email "email.will.be.duplicated@gmail.com" já está sendo usado.');
      expect(secondResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(secondResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(secondResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.requestId)).toEqual(true);
    });
  });

  describe('with "email" duplicated (different uppercase letters)', () => {
    test('should return a validation error', async () => {
      const firstResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'willTryToReuseEmail111',
          email: 'CAPS@gmail.com',
          password: 'validpassword',
        }),
      });

      const secondResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'willTryToReuseEmail222',
          email: 'caps@gmail.com',
          password: 'validpassword',
        }),
      });

      const secondResponseBody = await secondResponse.json();
      expect(secondResponse.status).toEqual(400);
      expect(secondResponseBody.name).toEqual('ValidationError');
      expect(secondResponseBody.message).toEqual('O email "caps@gmail.com" já está sendo usado.');
      expect(secondResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(secondResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(secondResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.requestId)).toEqual(true);
    });
  });

  describe('with "email" missing', () => {
    test('should return a validation error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"email" é um campo obrigatório.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "email" with an empty string', () => {
    test('should return a validation error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: '',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"email" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "email" that\'s not a String', () => {
    test('should return a validation error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 12345,
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"email" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "email" with invalid format', () => {
    test('should return a validation error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 'not.used.email@gmail.com@what',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"email" deve conter um email válido.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "password" missing', () => {
    test('should return a validation error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 'notusedemail@gmail.com',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"password" é um campo obrigatório.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "password" with an empty string', () => {
    test('should return a validation error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 'notusedemail@gmail.com',
          password: '',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"password" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "password" that\'s not a String', () => {
    test('should return a validation error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 'notusedemail@gmail.com',
          password: 123456,
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"password" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "password" too short', () => {
    test('should return a validation error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 'notusedemail@gmail.com',
          password: '123',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"password" deve conter no mínimo 8 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "password" too long', () => {
    test('should return a validation error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 'notusedemail@gmail.com',
          password: 'password.to.loooooooooooooooooooooooooooooooooooooooooooooooooooooooooong',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"password" deve conter no máximo 72 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });
});
