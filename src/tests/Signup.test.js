const { Signup } = require("../controllers/user.controller");

const mockRequest = (body) => ({
  body,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Signup function", () => {
  it("should return a success response if all inputs are valid and user does not exist", async () => {
    const req = mockRequest({
      emailorphone: "user@example.com",
      fullname: "John Doe",
      username: "johndoe",
      password: "password123",
    });

    const res = mockResponse();

    const next = jest.fn();

    await Signup(req, res, { next });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      data: [
        {
          success: {
            message: "account created !",
            token: expect.any(String),
            status: "ok",
          },
        },
      ],
      error: null,
    });
  });

  it("should throw an error if email or phone number is invalid", async () => {
    const req = mockRequest({
      emailorphone: "userexample.com",
      fullname: "John Doe",
      username: "johndoe",
      password: "password123",
    });

    const res = mockResponse();

    const next = jest.fn();

    await Signup(req, res, { next });

    expect(next).toHaveBeenCalledWith({
      statusCode: 400,
      name: "BAD_REQUEST",
      message: "invalid email or phone number !",
      errors: [
        { message: "invalid email or phone number !", status: "failed" },
      ],
    });
  });

  it("should throw an error if username is invalid", async () => {
    const req = mockRequest({
      emailorphone: "user@example.com",
      fullname: "John Doe",
      username: "johndoe_",
      password: "password123",
    });

    const res = mockResponse();

    const next = jest.fn();

    await Signup(req, res, { next });

    expect(next).toHaveBeenCalledWith({
      statusCode: 400,
      name: "BAD_REQUEST",
      message: "invalid username !",
      errors: [{ message: "invalid username !", status: "failed" }],
    });
  });

  it("should throw an error if password is less than 8 characters", async () => {
    const req = mockRequest({
      emailorphone: "user@example.com",
      fullname: "John Doe",
      username: "johndoe",
      password: "pass123",
    });

    const res = mockResponse();

    const next = jest.fn();

    await Signup(req, res, { next });

    expect(next).toHaveBeenCalledWith({
      statusCode: 400,
      name: "BAD_REQUEST",
      message: "password must have at least 8 characters",
      errors: [
        {
          message: "password must have at least 8 characters",
          status: "failed",
        },
      ],
    });
  });

  it("should throw an error if user with email or phone number already exists", async () => {
    const req = mockRequest({
      emailorphone: "user@example.com",
      fullname: "John Doe",
      username: "johndoe",
      password: "password123",
    });

    const res = mockResponse();

    const next = jest.fn();

    await Signup(req, res, next);
  });
});
