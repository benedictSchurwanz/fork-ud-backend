const request = require('supertest');
const express = require('express');
const db = require('../../data/db-config');
const authRequired = require('../../api/middleware/authRequired');
const profileRouter = require('../../api/profile/profileRouter');
const handleError = require('../../api/middleware/handleError');
const { profiles } = require('../../data/seeds/002-profiles');
// const server = require('../../api/app');

// Reset the test database before and after running tests

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});

beforeEach(async () => await db.seed.run());

afterAll(async () => await db.destroy());

afterEach(() => jest.clearAllMocks());

// Declare Mocks Upfront

jest.mock('../../api/middleware/authRequired', () =>
  jest.fn((req, res, next) => next())
);

jest.mock('../../api/middleware/permissionsRequired', () => ({
  adminRequired: jest.fn((req, res, next) => next()),
  superAdminRequired: jest.fn((req, res, next) => next()),
}));

// Declare Test API

const app = express();
app.use(express.json());
app.use('/profile', profileRouter);
app.use(handleError);

// Declare Constants

const { profile: initialProfile } = require('./../../data/seeds/002-profiles');
//   profile_id: '00ulthapbErVUwVJy4x6',
//   email: 'llama001@maildrop.cc',
//   first_name: 'Admin',
//   last_name: '1',
//   role_id: 1,
//   is_active: true,
//   progress_status: null,
//   attendance_rate: 1,
//   progress_id: null,
// };

// Declare Tests

describe('Sanity Checks', () => {
  test('matchers are working', () => {
    expect(true).toBe(true);
    expect(20 - 5).toBe(15);
    expect(9 + 10).not.toEqual(21);
  });

  test('test environment is being used', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});

describe('Profile Router', () => {
  describe('[GET] /profile', () => {
    let res;
    beforeAll(async () => {
      res = await request(app).get('/profile');
    });

    it('requires authentication', () => {
      expect(authRequired).toBeCalled();
    });

    it('responds with status 200', () => {
      const expected = 200;
      const actual = res.status;

      expect(actual).toBe(expected);
    });

    it('returns a list of profiles', () => {
      const expected = [...profiles.profiles];
      const actual = res.body;

      expect(actual).toMatchObject(expected);
    });
  });

  describe('[GET] /profile/:id', () => {
    describe('success', () => {
      let res;
      beforeAll(async () => {
        res = await request(app).get('/profile/00ultwew80Onb2vOT4x6');
      });

      it('requires authentication', () => {
        expect(authRequired).toBeCalled();
      });

      it('responds with status 200', async () => {
        const expected = 200;
        const actual = res.status;

        expect(actual).toBe(expected);
      });

      it('returns a profile object', () => {
        const expected = profiles.profiles[1];
        const actual = res.body;

        expect(actual).toMatchObject(expected);
      });
    });

    describe('failure', () => {
      describe('invalid profile ID', () => {
        const badID = 'bad-id';

        let res;
        beforeAll(async () => {
          res = await request(app).get(`/profile/${badID}`);
        });

        it('requires authentication', () => {
          expect(authRequired).toBeCalled();
        });

        it('responds with status 404', async () => {
          const expected = 404;
          const actual = res.status;

          expect(actual).toBe(expected);
        });

        it(`returns message "ProfileNotFound"`, () => {
          const expected = /ProfileNotFound/i;
          const actual = res.body.message;

          expect(actual).toMatch(expected);
        });
      });
    });
  });

  describe('[POST] /profile', () => {
    const postNewUser = (userInfo) =>
      request(app).post('/profile').send(userInfo);

    describe('success', () => {
      let res;
      beforeAll(async () => {
        res = await postNewUser({
          profile_id: 'bradbowman',
          first_name: 'Brad',
          last_name: 'Bowman',
          email: 'brad.bowman@maildrop.cc',
          role_id: 4,
          // attendance_rate: 0.5,
        });
      });

      it('requires authentication', () => {
        expect(authRequired).toBeCalled();
      });

      it('responds with status 201 Profile Created', async () => {
        const expected = 201;
        const actual = res.status;

        expect(actual).toBe(expected);
      });

      it('returns success message', () => {
        const expected = /profile created/i;
        const actual = res.body.message;

        expect(actual).toMatch(expected);
      });

      it('returns newly created profile', () => {
        const expected = {
          email: 'brad.bowman@maildrop.cc',
          first_name: 'Brad',
          is_active: null,
          last_name: 'Bowman',
          // profile_id: 'k8kaq719',
          progress_id: null,
          progress_status: null,
          role_id: 4,
        };
        const actual = res.body.profile;

        expect(actual).toMatchObject(expected);
      });
    });

    describe('failure', () => {
      describe('invalid first name', () => {
        describe('missing', () => {
          let res;
          beforeAll(() => {
            res = postNewUser({
              profile_id: '9000',
              // first_name: '',
              last_name: 'Lastname',
              email: 'realemail@maildrop.cc',
            });
          });

          it('responds with status 404', () => {
            const expected = 404;
            const actual = res;

            expect(actual).toBe(expected);
          });

          it.skip('returns message "first_name is required"', () => {
            const expected = /first_name is required/i;
            const actual = res.body.message;

            expect(actual).toMatch(expected);
          });
        });

        describe('too long', () => {
          const tooLongFirstName =
            'Lorem ipsum dolor sit amet lorem, consectetur porttitor.';
          let res;
          beforeAll(() => {
            res = postNewUser({
              profile_id: '9000',
              first_name: tooLongFirstName,
              last_name: 'Lastname',
              email: 'realemail@maildrop.cc',
            });
          });

          it('responds with status 406', () => {
            const expected = 406;
            const actual = res.status;

            expect(actual).toBe(expected);
          });

          it.skip('returns message "first_name must be between 2-50 chars"', () => {
            const expected = /first_name must be between 2-50 char/i;
            const actual = res.body.message;

            expect(actual).toMatch(expected);
          });
        });
      });

      describe('invalid last name', () => {
        describe('missing', () => {
          let res;
          beforeAll(() => {
            res = postNewUser({
              profile_id: '9000',
              first_name: 'Firstname',
              email: 'realemail@maildrop.cc',
            });
          });

          it.skip('responds with status 400', () => {
            const expected = 400;
            const actual = res.status;

            expect(actual).toBe(expected);
          });

          it.skip('returns message "last_name is required"', () => {
            const expected = /last_name is required/i;
            const actual = res.body.message;

            expect(actual).toMatch(expected);
          });
        });

        describe('too long', () => {
          const tooLongLastName =
            'Lorem ipsum dolor sit amet, consectetur massa nunc.';
          let res;
          beforeAll(() => {
            res = postNewUser({
              profile_id: '9000',
              first_name: 'Firstname',
              last_name: tooLongLastName,
              email: 'realemail@maildrop.cc',
            });
          });

          it.skip('responds with status 406', () => {
            const expected = 406;
            const actual = res.status;

            expect(actual).toBe(expected);
          });

          it('returns message "last_name must be between 2-50 chars"', () => {
            const expected = /last_name must be between 2-50 chars/i;
            const actual = res.body.message;

            expect(actual).toBe(expected);
          });
        });
      });

      describe('invalid email', () => {
        describe('missing', () => {
          let res;
          beforeAll(() => {
            res = postNewUser({
              profile_id: '9000',
              first_name: 'Firstname',
              last_name: 'Lastname',
            });
          });

          it.skip('responds with status 400', () => {
            const expected = 400;
            const actual = res.status;

            expect(actual).toBe(expected);
          });

          it.skip('returns message "email is required"', () => {
            const expected = /email is required/i;
            const actual = res.body.message;

            expect(actual).toMatch(expected);
          });
        });

        describe('misformatted', () => {
          let res;
          beforeAll(() => {
            res = postNewUser({
              profile_id: '9000',
              first_name: 'Firstname',
              last_name: 'Lastname',
              email: 'invalid-email',
            });
          });

          it.skip('responds with status 400', () => {
            const expected = 400;
            const actual = res.status;

            expect(actual).toBe(expected);
          });

          it.skip('returns message "email must be validly formatted"', () => {
            const expected = /email must be validly formatted/i;
            const actual = res.body.message;

            expect(actual).toMatch(expected);
          });
        });
      });
    });
  });

  describe('[PUT] /profile', () => {
    describe('success', () => {
      let res;
      beforeAll(async () => {
        const validReqBody = {
          profile_id: 'super-update',
          email: 'super-update@maildrop.cc',
        };
        res = await request(app).put('/profile').send(validReqBody);
      });

      it('requires authentication', () => {
        expect(authRequired).toBeCalled();
      });

      it('responds with status 200', () => {
        const expected = 200;
        const actual = res.status;

        expect(actual).toBe(expected);
      });
    });
  });
});
